const { ESLintIssueProvider } = require('./lib/providers/ESLintIssueProvider')
const { OSAIssueProvider } = require('./lib/providers/OSAIssueProvider')
const { jxaToEditor } = require('./lib/commands')
const { binDir } = require('./lib/extension')
const { getLocalConfig } = require('./lib/utils')

/**
 * The syntax for which to register the validator.
 * @constant {string} syntax
 */
const syntax = 'javascript+jxa'

/**
 * Extension global state
 * @property {object} [assistant] - The registered `IssueAssistant`.
 */
const state = {
  issueAssistant: null,
  listeners: new CompositeDisposable(),
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

  if (assistant == null && mode !== 'off') {
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

// Register IssueAssistant (linting) functionality.
state.issueAssistant = registerAssistant(getLocalConfig('jxa.linting.mode'))

// Ensure config changes are reflected in IssueAssistant functionality.
const assistantConfigKeys = ['jxa.linting.mode']
assistantConfigKeys.forEach(key => {
  const updater = (newValue, oldValue) => {
    if (newValue !== oldValue) {
      state.issueAssistant = registerAssistant(getLocalConfig(key))
    }
  }
  state.listeners.add(nova.config.onDidChange(key, updater))
  state.listeners.add(nova.workspace.config.onDidChange(key, updater))
})

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
