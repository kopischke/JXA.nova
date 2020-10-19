/**
 * @file Linting functionality via ESLint.
 * @external Linter
 */
const { getLocalConfig, requireJSON, workspaceContains } = require('../utils')

/**
 * Check if the linter can be set up  in a workspace This is always true,
 * as ESLint installation and configuration can happen anytime.
 * @returns {boolean} Whether the linter can process the document.
 * @param {object} _ - The Workspace the linter is to be set up for (ignored).
 */
function canSetup (_) { return true }

/**
 * Check if the linter can process an editor’s document. This is true when:
 * - the document is part of the workspace, and
 * - the workspace contains ESLint configuration data.
 * @returns {boolean} Whether the linter can process the document.
 * @param {object} editor - The TextEditor the linter is called on.
 */
function canLint (editor) {
  const file = editor.document.path
  if (file == null || workspaceContains(nova.workspace, file)) {
    const root = nova.workspace.path
    const eslintrc = nova.fs.listdir(root).filter(name => name.startsWith('.eslintrc.'))
    if (eslintrc.length) return true

    const packageFile = nova.path.join(root, 'package.json')
    const packageJSON = requireJSON(packageFile)
    if (packageJSON) return packageJSON.eslintConfig != null
  }

  return false
}

/**
 * Get the parameters for an `eslint` process.
 * @returns {Array.<string, Array.<string>, boolean>} Array of bin path, args, shell needed.
 */
function getProcessParams () {
  const configured = getLocalConfig('jxa.linting.eslint-binary', 'string')
  if (configured) return [configured, [], false]

  const packageFile = nova.path.join(nova.workspace.path, 'package.json')
  const packageJSON = requireJSON(packageFile)
  if (packageJSON) {
    const { dependencies, devDependencies } = packageJSON
    if (
      (dependencies && Object.keys(dependencies).includes('eslint')) ||
      (devDependencies && Object.keys(devDependencies).includes('eslint'))
    ) {
      return ['npx', ['--no-install', 'eslint'], true]
    }
  }

  return ['eslint', [], true]
}

/**
 * Parse the issues out of ESLInt’s JSON output for the first linted file.
 * @returns {Array.<object>} An array of Issues.
 * @param {string} eslintJSON - The output JSON to parse.
 */
function parseIssues (eslintJSON) {
  const issues = []

  if (eslintJSON != null && eslintJSON.trim().length) {
    JSON.parse(eslintJSON)[0].messages.forEach(message => {
      const issue = new Issue()
      issue.source = 'ESLint'
      issue.message = message.message
      issue.code = message.ruleId ? message.ruleId : 'Parsing Error'
      issue.line = message.line || 0
      issue.column = message.column || 0
      issue.endLine = message.endLine || issue.line
      issue.endColumn = message.endColumn || issue.column
      issue.severity = (message.fatal || message.severity === 2)
        ? IssueSeverity.Error
        : IssueSeverity.Warning

      issues.push(issue)
    })
  }

  return issues
}

/**
 * Get an informative issue for summary purposes.
 * @returns {Array.<object>} An array of Issue objects of severity `Info`.
 * @param {string} eslintJSON - The results JSON provided by ESLint.
 */
function issuesInfo (eslintJSON) {
  const info = []

  if (eslintJSON != null && eslintJSON.trim().length) {
    const pluralise = (word, count) => count === 1 ? word : `${word}s`
    const results = JSON.parse(eslintJSON)[0]
    const { errorCount, warningCount } = results
    const { fixableErrorCount, fixableWarningCount } = results

    if (errorCount + warningCount) {
      const message = ['ESLint reports']
      if (errorCount > 0) {
        const errorStr = pluralise('error', fixableErrorCount)
        message.push(`${fixableErrorCount} ${errorStr} (of ${errorCount})`)
      }
      if (errorCount > 0 && warningCount > 0) message.push('and')
      if (warningCount > 0) {
        const warningStr = pluralise('warning', fixableWarningCount)
        message.push(`${fixableWarningCount} ${warningStr} (of ${warningCount})`)
      }
      message.push('as fixable.')

      const issue = new Issue()
      issue.source = nova.extension.name
      issue.message = message.join(' ')
      issue.line = 0
      issue.column = 0
      issue.severity = IssueSeverity.Info

      info.push(issue)
    }
  }

  return info
}

/**
 * Create a standard error message and log it to console.
 * @returns {string} The logged error message.
 * @param {string} message - The input error message to process.
 */
function logError (message) {
  const msg = `Could not get issues from 'ESLint': ${message}`
  console.error(msg)
  return msg
}

/**
 * Get issues on source changes.
 * @returns {Promise} Asynchronous issues collection.
 * @param {object} editor - The TextEditor the linter is called on.
 */
function onChange (editor) {
  let file = editor.document.path
  const range = new Range(0, editor.document.length)
  const string = editor.getTextInRange(range)

  return new Promise((resolve, reject) => {
    try {
      const [bin, args, shell] = getProcessParams()
      const opts = {
        args: args.concat(['--format', 'json', '--stdin']),
        shell: shell
      }

      if (file == null) file = nova.path.join(nova.workspace.path, '_.jxa')
      opts.args.push('--stdin-filename', file)
      const linter = new Process(bin, opts)
      const stdout = []
      const stderr = []

      linter.onStdout(line => stdout.push(line))
      linter.onStderr(line => stderr.push(line))
      linter.onDidExit(_ => {
        if (stderr.length) logError(stderr.join(''))
        const results = stdout.join('')
        let issues = parseIssues(results)
        if (issues.length && !nova.config.get('jxa.linting.hide-info')) {
          issues = issues.concat(issuesInfo(results))
        }
        resolve(issues)
      })
      linter.start()

      const writer = linter.stdin.getWriter()
      writer.write(string)
      writer.close()
    } catch (error) {
      reject(logError(error.message))
    }
  })
}

/**
 * Get issues on file save.
 * @returns {Promise} Asynchronous issues collection.
 * @param {object} editor - The TextEditor the linter is called on.
 * @static
 */
function onSave (editor) {
  const file = editor.document.path
  this.setFormat()

  return new Promise((resolve, reject) => {
    try {
      const [bin, args, shell] = getProcessParams()
      const opts = {
        args: args.concat(['--format', 'json', file]),
        shell: shell
      }
      const linter = new Process(bin, opts)
      const stdout = []
      const stderr = []

      linter.onStdout(line => stdout.push(line))
      linter.onStderr(line => stderr.push(line))
      linter.onDidExit(_ => {
        if (stderr.length) logError(stderr.join(''))
        const results = stdout.join('')
        let issues = parseIssues(results)
        if (issues.length && !nova.config.get('jxa.linting.hide-info')) {
          issues = issues.concat(issuesInfo(results))
        }
        resolve(issues)
      })
      linter.start()
    } catch (error) {
      reject(logError(error.message))
    }
  })
}

/**
 * @implements {external:Linter}
 */
module.exports = {
  canLint: canLint,
  canSetup: canSetup,
  onChange: onChange,
  onSave: onSave
}
