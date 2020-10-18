const eslint = require('./lib/linters/eslint')
const osacompile = require('./lib/linters/osacompile')
const { jxaToEditor } = require('./lib/commands')
const { binDir } = require('./lib/extension')
const { getLocalConfig } = require('./lib/utils')

/**
 * The syntax for which to register the linter.
 * @constant {string} syntax
 */
const syntax = 'javascript+jxa'

/**
 * Extension global state
 * @property {object} [assistant] - The registered `IssueAssistant`.
 * @property {object} [commands] - All registered `Command` handlers.
 */
const state = {
  issueAssistant: null,
  providers: new CompositeDisposable(),
  commands: new CompositeDisposable()
}

/**
 * Ensure included binaries are executable.
 * @function activate
 */
exports.activate = function () {
  const binaries = nova.fs.listdir(binDir)
    .map(name => nova.path.join(binDir, name))
    .filter(path => {
      return nova.fs.stat(path).isFile() && !nova.fs.access(path, nova.fs.X_OK)
    })

  if (binaries.length) {
    const stderr = []
    const args = { args: ['+x'].concat(binaries) }
    const chmod = new Process('/bin/chmod', args)
    chmod.onStderr(line => stderr.push(line))
    chmod.onDidExit(code => { if (code > 0) console.error(stderr.join('')) })
    chmod.start()
  }
}

/**
 * Unregister all Disposable items in the extension state.
 * By rights, Nova should do that by itself as part of the extension life cycle,
 * but that seems to not (always) be the case.
 * @function deactivate
 */
exports.deactivate = function () {
  Object.keys(state).forEach(key => {
    const item = state[key]
    if (item != null && Disposable.isDisposable(item)) item.dispose()
  })
}

/**
 * An item complying with `IssueAssistant` interface.
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
 * The available linting providers.
 */
const providers = [eslint, osacompile]
providers.forEach(item => {
  if (Disposable.isDisposable(item)) state.providers.add(item)
})

/**
 * Register an IssueAssistant instance with Nova’s AssistantRegistry.
 * This will forward the `provideIssues` request to the first linter
 * from an ordered list that responds true to both `canSetup()` and
 * request and a `canLint(editor)` request. Linters need to provide
 * both an `onChange` and an `onSave` function besides the above.
 * As a side effect, it will set `state.issueAssistant` correctly.
 * @function registerAssistant
 * @returns {Disposable} The registered handler.
 */
function registerAssistant () {
  if (state.issueAssistant != null) {
    state.issueAssistant.dispose()
    state.issueAssistant = null
  }

  let assistant = state.issueAssistant
  const mode = getLocalConfig('jxa.linting.mode')
  if (assistant == null && mode !== 'off') {
    const available = providers.filter(item => item.canSetup(nova.workspace))

    let provider = null
    if (available.length) {
      /**
       * The issue request handling function. This dynamically dispatches
       * the request to the best available linter (see above), and returns
       * an information pseudo-Issue if no linter is available.
       * @implements {external:IssueAssistant}
       */
      provider = {
        provideIssues: function (editor) {
          const linter = available.find(item => item.canLint(editor))
          if (linter != null) return linter[mode](editor)
          return new Promise((resolve, reject) => {
            if (!nova.config.get('jxa.linting.hide-info')) {
              const issue = new Issue()
              issue.source = nova.extension.name
              issue.message = 'Linting not available.'
              issue.line = 0
              issue.column = 0
              issue.severity = IssueSeverity.Info
              resolve([issue])
            } else {
              resolve([])
            }
          })
        }
      }
    }

    if (provider != null) {
      const options = { event: mode }
      assistant = nova.assistants.registerIssueAssistant(syntax, provider, options)
    }
  }

  return assistant
}

// Register IssueAssistant (linting) functionality.
state.issueAssistant = registerAssistant()

// Register Commands.
state.commands.add(
  nova.commands.register('fileToEditor', (editor) => {
    const range = new Range(0, editor.document.length)
    jxaToEditor(editor.getTextInRange(range))
  })
)

state.commands.add(
  nova.commands.register('selectionToEditor', (editor) => {
    jxaToEditor(editor.selectedText)
  })
)
