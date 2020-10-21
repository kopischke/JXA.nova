/**
 * @file Linting functionality via osacompile.
 * @external Linter
 * @external RunResults
 * @implements {Disposable}
 * @implements {external:Linter}
 */
const { runAsync } = require('../process')
const { binDir } = require('../extension')
const { getEditorText } = require('../utils')

const tmpDir = nova.path.join(nova.extension.workspaceStoragePath, 'osacompile.tmp')
const binary = nova.path.join(binDir(), 'jxabuild')

/**
 * Get an informative issue for summary purposes.
 * @returns {Array.<object>} An array of Issue objects of severity `Info`.
 */
function issuesInfo () {
  const issue = new Issue()
  issue.source = nova.extension.name
  issue.message = 'Linting provided by osacompile.'
  issue.line = 0
  issue.column = 0
  issue.severity = IssueSeverity.Info
  return [issue]
}

/**
 * Process the results of an asynchronous `osacompile` call.
 * @returns {Array.<object>} An array of {@link Issue} objects.
 * @param {external:RunResults} results - The results of the {@link runAsync}} call.
 */
function processResults (results) {
  const { code, stderr } = results
  if (code === 0) return []

  const parser = new IssueParser('jxa-linter-osacompile')
  const lines = stderr.split('\n')
  lines.forEach(line => parser.pushLine(line))

  let issues = parser.issues
  if (issues.length && !nova.config.get('jxa.linting.hide-info')) {
    issues = issues.concat(issuesInfo())
  }
  return issues
}

/**
 * Check if the linter can be set up  in a workspace This is true when:
 * - the document is part of the workspace, and
 * - the workspace contains ESLint configuration data.
 * @returns {boolean} Whether the linter can process the document.
 * @param {object} _ - The Workspace the linter is to be set up for (ignored).
 */
exports.canSetup = function (_) {
  if (!nova.fs.access(binary, nova.fs.X_OK)) {
    console.error(`osacompile script wrapper '${binary}' is not an executable file.`)
    return false
  }

  const stat = nova.fs.stat(tmpDir)
  if (stat == null) return true // `jxabuild` will create the directory
  if (!stat.isDirectory() || !nova.fs.access(tmpDir, nova.fs.W_OK)) {
    console.error(`Temporary build directory path '${tmpDir}' is not a writable directory.`)
    return false
  }

  return true
}

/**
 * Check if the linter can process an editor’s document.
 * @returns {boolean} Whether the linter can process the document.
 * @param {object} _ - The TextEditor the linter is called on (ignored).
 */
exports.canLint = function (_) { return true }

/**
 * Conform to Disposable interface. This removes the temporary build directory.
 * @see {@link https://docs.nova.app/api-reference/disposable/}
 */
exports.dispose = function () {
  const stat = nova.fs.stat(tmpDir)
  if (stat != null && stat.isDirectory()) nova.fs.rmdir(tmpDir)
}

/**
 * Get issues on source changes.
 * @returns {Promise} Asynchronous issues collection.
 * @param {object} editor - The TextEditor the linter is called on.
 */
exports.onChange = async function (editor) {
  const env = { JXABUILD_DIR: tmpDir, JXABUILD_FORMAT: 'scpt' }
  const opts = { args: ['-'], env: env, shell: false }
  const source = getEditorText(editor.document)
  const results = await runAsync(binary, opts, source)
  return processResults(results)
}

/**
 * Get issues on file save.
 * @returns {Promise} Asynchronous issues collection.
 * @param {object} editor - The TextEditor the linter is called on.
 */
exports.onSave = async function (editor) {
  const env = { JXABUILD_DIR: tmpDir, JXABUILD_FORMAT: 'scpt' }
  const opts = { args: [editor.document.path], env: env, shell: false }
  const results = await runAsync(binary, opts)
  return processResults(results)
}
