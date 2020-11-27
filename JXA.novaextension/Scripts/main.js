/**
 * @file Main extension script.
 */
const { makeExecutable } = require('./core/binaries')
const cmds = require('./core/commands')
const { compileJXA } = require('./core/jxa')
const { changedIssues } = require('./core/issues')

const {
  documentIsClosed,
  documentIsOpenInEditors,
  findDocumentByURI,
  getDocumentText
} = require('./lib/document')
const ext = require('./lib/extension')
const { getLocalConfig } = require('./lib/utils')

/**
 * Extension syntax.
 */
const syntax = 'javascript+jxa'

/**
 * Configuration keys.
 * @property {boolean} disabled - The “Disable ESLint” workspace option.
 */
const configKeys = {
  linting: `${ext.prefixConfig()}.linting`
}

/**
 * Extension binaries.
 */
const binaries = {
  build: nova.path.join(ext.binDir(), 'jxabuild'),
  run: nova.path.join(ext.binDir(), 'jxarun')
}

/**
 * The IssueCollection used. We cannot use the default issue collection
 * provided via the AssistantRegistry because there is no way to void it,
 * e.g. on configuration changes.
 */
const collection = new IssueCollection()

/**
 * Extension state.
 * @property {boolean} activationErrorHandled - Has an activation error been handled already?
 * @property {boolean} nodePath - The Updatable Node executable path.
 */
const state = { activationErrorHandled: false }

/**
 * A queue data item.
 * @typedef QueueData
 * @property {number} lastStarted - The index of the last started queue item.
 * @property {number} lastEnded - The index of the last ended queue item.
 */

/**
 * Simple queue helping guarantee asynchronous linting chronology.
 * @see {@link maybeLint}
 */
const queue = {}

/**
 * The Issue parser used for `osacompile`’s output.
 */
const parser = new IssueParser('jxa-linter-osacompile')

/**
 * Void the Issue collection for a URI (if necessary).
 * @returns {Array} An empty array (which we can return to the Assistant).
 * @param {string} uri - The URI to void.
 */
const noIssues = uri => {
  if (collection.has(uri)) collection.remove(uri)
  return []
}

/**
 * Launch a lint operation, if possible.
 * @returns {boolean} Whether a lint operation was started.
 * @param {object} editor - The TextEditor to lint.
 */
async function maybeLint (editor) {
  let file = null

  try {
    if (!getLocalConfig(configKeys.linting, 'boolean')) {
      collection.clear()
      return []
    }

    // Do not lint empty documents.
    const doc = editor.document
    const uri = doc.uri
    const path = doc.path
    if (doc.isEmpty) return noIssues(uri)

    // Get this early, there can be race conditions.
    const src = getDocumentText(doc)

    // OSACompile needs to write out a temporary file, as “linting”
    // is actually just catching compile errors.
    file = nova.path.join(ext.tmpDir(), nova.path.basename(path) + '.scpt')

    // Because lint operations are asynchronous and their duration can
    // vary widely depending on how busy the system is, we need to ensure
    // we respect their start chronology when processing their results
    // (i.e. ensure that slower older runs do not overwrite faster newer ones).
    if (queue[uri] == null) queue[uri] = { lastStarted: 1, lastEnded: 0 }
    const index = queue[uri].lastStarted++
    try {
      const { stderr } = await compileJXA(src, file)
      if (queue[uri].lastEnded < index) {
        queue[uri].lastEnded = index
        if (documentIsClosed(doc) || stderr == null) {
          noIssues(uri)
        } else {
          stderr.split('\n').forEach(line => parser.pushLine(line))
          const issues = parser.issues
          const changed = changedIssues(collection.get(uri), issues)
          if (changed) collection.set(uri, issues)
        }
      }
    } catch (error) {
      noIssues(uri)
      throw error
    }
  } catch (error) {
    console.error(error)
  } finally {
    parser.clear()
    if (file != null) nova.fs.remove(file)
  }

  return []
}

/**
 * Register the ESLint IssueAssistant.
 */
function registerAssistant () {
  const selector = { syntax: syntax }
  const object = { provideIssues: maybeLint }
  nova.assistants.registerIssueAssistant(selector, object)
}

/**
 * Register the extension Commands.
 */
function registerCommands () {
  const prefix = ext.prefixCommand()

  // User facing commands.
  nova.commands.register(`${prefix}.file2editor`, (editor) => {
    cmds.toScriptEditor(getDocumentText(editor))
  })
  nova.commands.register(`${prefix}.selection2editor`, (editor) => {
    cmds.toScriptEditor(editor.selectedText)
  })
  nova.commands.register(`${prefix}.workspace-config`, (_) => {
    nova.workspace.openConfig()
  })

  // Internal commands for task usage.
  nova.commands.register(`${prefix}._source`, (_) => {
    const doc = nova.workspace.activeTextEditor.document
    return doc.syntax === syntax ? getDocumentText(doc) : ''
  })
}

/**
 * Register configuration listeners.
 */
function registerConfigListeners () {
  nova.config.onDidChange(configKeys.linting, (newValue, oldValue) => {
    if (newValue !== oldValue) nova.workspace.textEditors.forEach(maybeLint)
  })
  nova.workspace.config.onDidChange(configKeys.linting, (newValue, oldValue) => {
    if (newValue !== oldValue) nova.workspace.textEditors.forEach(maybeLint)
  })
}

/**
 * Register TextEditor listeners.
 * Because we piggyback on the Issue AssistantRegistry, but do not
 * actually use it, we do not fully participate in the teardown part
 * of its excellent event setup.
 */
function registerEditorListeners () {
  nova.workspace.onDidAddTextEditor(added => {
    // Clear issues when a document is closed. We can’t do that inside
    // the linting operation, because that always has a valid editor
    // context (and hence an open document).
    added.onDidDestroy(destroyed => {
      const doc = destroyed.document
      const uri = doc.uri
      if (documentIsClosed(doc)) {
        if (collection.has(uri)) collection.remove(uri)
      } else {
        // There is a race condition where a very rapid change just before
        // a TextEditor containing the document is destroyed leaves the
        // collection for that document in the wrong state.
        maybeLint(documentIsOpenInEditors(doc)[0])
      }
    })

    // Catch file rename operations on save, which for Nova means:
    // 1. closing the old document 2. opening the new document.
    // 1. needs handling as above, 2. will fire a change event for the
    // editor(s) containing the renamed file, but copying the issues over
    // will stop them flickering in and out of existence in the Issues pane.
    added.onWillSave(willSave => {
      const oldURI = willSave.document.uri
      const once = willSave.onDidSave(didSave => {
        const newURI = didSave.document.uri
        if (newURI !== oldURI && collection.has(oldURI)) {
          collection.set(newURI, collection.get(oldURI))
          if (!findDocumentByURI(oldURI)) collection.remove(oldURI)
        }
        once.dispose()
      })
    })
  })
}

/**
 * Update the extension configuration.
 */
function updateConfig () {
  const prefix = ext.prefixConfig()
  const outdated = [
    'jxa.linting.mode',
    'jxa.linting.hide-info',
    'jxa.linting.eslint-off',
    'jxa.linting.eslint-binary'
  ]

  if (!nova.config.get(`${prefix}.updated.v2.0.0`)) {
    outdated.forEach(key => {
      nova.config.remove(key)
      nova.workspace.config.remove(key)
    })
    nova.config.set(`${prefix}.updated.v2.0.0`, true)
  }
}

/**
 * Initialise the extension in the workspace.
 * Inform user of errors while activating (once only).
 */
exports.activate = async function () {
  try {
    await makeExecutable(Object.values(binaries))
    updateConfig()
    registerCommands()
    registerConfigListeners()
    registerEditorListeners()
    registerAssistant()
  } catch (error) {
    console.error(error)
    if (!nova.inDevMode() && !state.activationErrorHandled) {
      const msg = nova.localize(`${ext.prefixMessage()}.msg.activation-error`)
      nova.workspace.showErrorMessage(msg)
      state.activationErrorHandled = true
    }
  }
}

/**
 * Clean up after the extension.
 */
exports.deactivate = function () {
  collection.clear()
}
