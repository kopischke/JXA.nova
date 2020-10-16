const { ESLintIssueProvider } = require('./lib/providers/ESLintIssueProvider')
const { OSAIssueProvider } = require('./lib/providers/OSAIssueProvider')
const { jxaToEditor } = require('./lib/commands')
const { binDir } = require('./lib/extension')

/**
 * The syntax for which to register the validator.
 * @constant {string} syntax
 */
const syntax = 'javascript+jxa'

/**
 * Keys to the plugin’s configuration options.
 * @property {string} validate - The configuration for the validation mode.
 */
const config = { validate: 'jxa.validation.mode' }

/**
 * Extension global state
 * @property {Disposable} [assistant] - The registered `IssueAssistant`.
 */
const state = { issueAssistant: null }

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
 * Register a `OSAIssueProvider` instance with Nova’s AssistantRegistry.
 * @see {@link https://docs.nova.app/api-reference/assistants-registry/}
 * @function registerAssistant
 * @returns {?Disposable} The registered `IssueAssistant`.
 * @param {string} [mode] - Mode, as described in {@link OSAIssueProvider}.
 */
function registerAssistant (mode) {
  let assistant = state.issueAssistant
  if (assistant != null) {
    assistant.dispose()
    assistant = null
  }

  if (assistant == null && mode != null) {
    let validator
    if (ESLintIssueProvider.available(nova.workspace)) {
      validator = new ESLintIssueProvider(mode)
    } else if (OSAIssueProvider.available(nova.workspace)) {
      validator = new OSAIssueProvider(mode)
    }
    if (validator != null) {
      const options = { event: mode }
      assistant = nova.assistants.registerIssueAssistant(syntax, validator, options)
    }
  }

  return assistant
}

state.issueAssistant = registerAssistant(nova.workspace.config.get(config.validate))

nova.workspace.config.onDidChange(config.validate, (newValue, oldValue) => {
  if (newValue !== oldValue) state.issueAssistant = registerAssistant(newValue)
})

nova.commands.register('fileToEditor', (editor) => {
  const range = new Range(0, editor.document.length)
  jxaToEditor(editor.getTextInRange(range))
})

nova.commands.register('selectionToEditor', (editor) => {
  jxaToEditor(editor.selectedText)
})
