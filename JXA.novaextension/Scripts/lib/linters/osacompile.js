/**
 * @file Linting functionality via osacompile.
 * @external Linter
 * @implements {Disposable}
 * @implements {external:Linter}
 */
const { binDir } = require('../extension')
const tmpDir = nova.path.join(nova.extension.workspaceStoragePath, 'osacompile.tmp')
const binary = 'jxabuild'
const matcher = 'jxa-linter-osacompile'

/**
 * Get a build process configured and ready.
 * @param {string} forSource - Either the file to compile, or '-' for stdin.
 * @returns {Process} A Nova API process encapsulating the build.
 */
function getProcess (forSource) {
  const opts = {
    args: [forSource],
    env: { JXABUILD_DIR: tmpDir, JXABUILD_FORMAT: 'scpt' },
    shell: false
  }
  return new Process(nova.path.join(binDir(), binary), opts)
}

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
 * Check if the linter can be set up  in a workspace This is true when:
 * - the document is part of the workspace, and
 * - the workspace contains ESLint configuration data.
 * @returns {boolean} Whether the linter can process the document.
 * @param {object} _ - The Workspace the linter is to be set up for (ignored).
 */
exports.canSetup = function (_) {
  const stat = nova.fs.stat(tmpDir)
  if (stat == null) return true // `jxabuild` will create the directory
  if (!stat.isDirectory() || !nova.fs.access(tmpDir, nova.fs.W_OK)) {
    console.error(`Temporary build directory path '${tmpDir}' is not a writable directory.`)
    return false
  }

  const bin = nova.path.join(binDir(), binary)
  if (!nova.fs.access(bin, nova.fs.X_OK)) {
    console.error(`osacompile script wrapper '${binary}' is not an executable file.`)
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
exports.onChange = function (editor) {
  const range = new Range(0, editor.document.length)
  const string = editor.getTextInRange(range)

  return new Promise((resolve, reject) => {
    try {
      const parser = new IssueParser(matcher)
      const linter = getProcess('-')
      linter.onStderr(line => parser.pushLine(line))
      linter.onDidExit(_ => {
        let issues = parser.issues
        if (issues.length && !nova.config.get('jxa.linting.hide-info')) {
          issues = issues.concat(issuesInfo())
        }
        resolve(issues)
      })
      linter.start()

      const writer = linter.stdin.getWriter()
      writer.write(string)
      writer.close()
    } catch (error) {
      reject(error.message)
    }
  })
}

/**
 * Get issues on file save.
 * @returns {Promise} Asynchronous issues collection.
 * @param {object} editor - The TextEditor the linter is called on.
 */
exports.onSave = function (editor) {
  const file = editor.document.path

  return new Promise((resolve, reject) => {
    try {
      const parser = new IssueParser(matcher)
      const linter = getProcess(file)
      linter.onStderr(line => parser.pushLine(line))
      linter.onDidExit(_ => {
        let issues = parser.issues
        if (issues.length && !nova.config.get('jxa.linting.hide-info')) {
          issues = issues.concat(issuesInfo())
        }
        resolve(issues)
      })
      linter.start()
    } catch (error) {
      reject(error.message)
    }
  })
}
