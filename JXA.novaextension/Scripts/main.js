const { JXAValidator } = require('./lib/JXAValidator')
const { jxaToEditor } = require('./lib/commands')

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
 * Register a `JXAValidator` instance with Nova’s AssistantRegistry.
 * @see {@link https://docs.nova.app/api-reference/assistants-registry/}
 * @function registerAssistant
 * @returns {?Disposable} The registered `IssueAssistant`.
 * @param {string} [mode] - Mode, as described in {@link JXAValidator}.
 */
function registerAssistant (mode) {
  let assistant = state.issueAssistant
  if (assistant != null) {
    assistant.dispose()
    assistant = null
  }

  if (assistant == null && mode != null) {
    const validator = new JXAValidator(mode)
    const options = { event: mode }
    assistant = nova.assistants.registerIssueAssistant(syntax, validator, options)
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
