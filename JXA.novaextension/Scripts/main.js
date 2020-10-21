const eslint = require('./lib/linters/eslint')
const osacompile = require('./lib/linters/osacompile')
const { toScriptEditor } = require('./lib/commands')
const { binDir } = require('./lib/extension')
const { getLocalConfig } = require('./lib/utils')

/**
 * The syntax for which to register the linter.
 */
const syntax = 'javascript+jxa'

/**
 * Extension global state
 * @property {Disposable} [issueAssistant] - The registered IssueAssistant.
 * @property {string} [issueMode] - The activation mode for the registered IssueAssistant.
 * @property {boolean} activationErrorHandled - Was {@link handleActivationError} called?
 */
const state = {
  issueAssistant: null,
  issueMode: null,
  activationErrorHandled: false
}

/**
 * The available linting providers, in fallback cascade order.
 * We register the disposable ones with Nova for deactivation, see {@link deactivate}.
 * @see {@link registerIssueAssistant} as to their usage.
 */
const providers = [eslint, osacompile]

/**
 * The IssueCollection for the extension’s linter functionality.
 * @see {@link registerIssueAssistant} as to the how and why of this.
 */
const collection = new IssueCollection()

/**
 * Ensure included binaries are executable.
 * @returns {Promise} The `chmod` operation.
 * @function chmodBinaries
 */
function chmodBinaries () {
  return new Promise((resolve, reject) => {
    try {
      const location = binDir()
      const binaries = nova.fs.listdir(location)
        .map(name => nova.path.join(location, name))
        .filter(path => {
          return nova.fs.stat(path).isFile() && !nova.fs.access(path, nova.fs.X_OK)
        })

      if (binaries.length === 0) {
        const msg = `Can’t locate extension binaries at path “${location}”.`
        const err = new Error(msg)
        reject(err)
      }

      const stderr = []
      const args = { args: ['+x'].concat(binaries) }
      const chmod = new Process('/bin/chmod', args)
      chmod.onStderr(line => stderr.push(line))
      chmod.onDidExit(code => {
        if (code > 0) reject(new Error(stderr.join('')))
        resolve(true)
      })
      chmod.start()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * An item complying with the IssueAssistant interface.
 * @external IssueAssistant
 * @interface
 * @see {@link https://docs.nova.app/api-reference/assistants-registry/#registerissueassistant-selector-object-options}}
 */

/**
 * @interface Linter
 */

/**
 * Checks if the Linter can be set up for a Workspace.
 * @function canSetup
 * @returns {boolean} Whether the the workspace can be linted.
 * @param {object} workspace - The Workspace to check.
 */

/**
 * Checks if the Linter can lint a TextEditor’s content.
 * @function canLint
 * @returns {boolean} Whether the contents of the editor can be linted.
 * @param {object} editor - The TextEditor to check.
 */

/**
 * Check for issues on editor content changes.
 * @function onChange
 * @returns {Promise} A Promise, as specified by the IssueAssistant interface.
 * @param {object} editor - The TextEditor to check.
 */

/**
 * Check for issues on file save.
 * @function onSave
 * @returns {Promise} A Promise, as specified by the IssueAssistant interface.
 * @param {object} editor - The TextEditor to check.
 */

/**
 * Register an IssueAssistant instance with Nova’s AssistantRegistry.
 * This will forward the `provideIssues` request to the first {@link Linter}
 * from an ordered list that responds true to both `canSetup()` and `canLint()`.
 * As a side effect, it will set `state.issueAssistant` correctly.
 * @function registerAssistant
 */
function registerIssueAssistant () {
  const mode = getLocalConfig('jxa.linting.mode')

  if (state.issueMode === mode) return

  state.issueMode = mode
  if (state.issueAssistant != null) unregisterIssueAssistant()
  if (state.issueMode !== 'off') {
    const available = providers.filter(item => item.canSetup(nova.workspace))

    let provider = null
    if (available.length) {
      /**
       * The issue request handling function. This dynamically dispatches the
       * request to the best available linter (see above). Because Nova, as of 1.2,
       * does not clear the global IssueCollection properly when switching between
       * onSave and onChange modes, but reconstructing the event management of the
       * IssueAssistantRegistry would be painful, we cheat: we register an assistant,
       * but always return nada from it, filling our own IssueCollection instead.
       * @implements {external:IssueAssistant}
       */
      provider = {
        provideIssues: function (editor) {
          const linter = available.find(item => item.canLint(editor))
          const uri = editor.document.uri

          if (linter != null) {
            return linter[mode](editor)
              .then(issues => {
                collection.set(uri, issues)
                return []
              })
              .catch(message => console.error(message))
          }

          // Information pseudo-Issue if no linter is available.
          return new Promise((resolve, reject) => {
            if (!nova.config.get('jxa.linting.hide-info')) {
              const issue = new Issue()
              issue.source = nova.extension.name
              issue.message = 'Linting not available.'
              issue.line = 0
              issue.column = 0
              issue.severity = IssueSeverity.Info
              collection.set(uri, [issue])
            }
            resolve([])
          })
        }
      }
    }

    if (provider != null) {
      const options = { event: state.issueMode }
      state.issueAssistant = nova.assistants.registerIssueAssistant(syntax, provider, options)
    }
  }
}

/**
 * Unregister the current IssueAssistant instance from Nova’s AssistantRegistry.
 */
function unregisterIssueAssistant () {
  state.issueAssistant.dispose()
  state.issueAssistant = null
  collection.clear()
}

/**
 * Register the extension Configuration listeners.
 * This ensures changed prefs take effect immediately.
 */
function registerListeners () {
  [nova.workspace.config, nova.config].forEach(config => {
    config.onDidChange('jxa.linting.mode', registerIssueAssistant)
  })
}

/**
 * Register the extension Commands.
 */
function registerCommands () {
  nova.commands.register('fileToEditor', (editor) => {
    const range = new Range(0, editor.document.length)
    toScriptEditor(editor.getTextInRange(range))
  })

  nova.commands.register('selectionToEditor', (editor) => {
    toScriptEditor(editor.selectedText)
  })

  nova.commands.register('workspaceConfig', (_) => {
    nova.workspace.openConfig()
  })
}

/**
 * Show an error panel to the user.
 */
function handleActivationError () {
  if (state.activationErrorHandled === false) {
    let msg = `There was an error activating the “${nova.extension.name}” extension. `
    msg += 'Please check the extension console for errors.'
    nova.workspace.showErrorMessage(msg)
    state.activationErrorHandled = true
  }
}

/**
 * Initialise extension in workspace:
 *
 * - ensure binaries are executable after install;
 * - register the IssueAssistant;
 * - register listeners for prefs;
 * - register commands;
 * - register disposable providers with Nova.
 */
exports.activate = function () {
  if (!nova.inDevMode()) {
    chmodBinaries().catch(error => {
      console.error(error.message)
      handleActivationError()
    })
  }

  try {
    registerIssueAssistant()
    registerListeners()
    registerCommands()
    providers.forEach(item => {
      if (Disposable.isDisposable(item)) nova.subscriptions.add(item)
    })
  } catch (error) {
    handleActivationError()
  }
}
