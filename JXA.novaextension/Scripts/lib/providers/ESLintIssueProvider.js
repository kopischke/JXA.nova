/**
 * @file Diagnostics / linting functionality via `eslint`.
 */
const { IssueProvider } = require('./IssueProvider')

class ESLintIssueProvider extends IssueProvider {
  /**
   * ESLint based issue provider for the JXA syntax.
   * Needs either a project-local install of `eslint`, or the path to a global install.
   * @augments IssueProvider
   * @param {string} event - see {@link IssueProvider}
   */
  constructor (event) {
    super(event)
    switch (event) {
      case 'onChange':
        this.provideIssues = ESLintIssueProvider.provideIssuesSTDIN
        break
      case 'onSave':
        this.provideIssues = ESLintIssueProvider.provideIssuesFile
        break
    }
    this.issueMatcher = 'jxa-linter-eslint-compact'
    this.binName = 'eslint'
  }

  /**
   * Get the path to the `eslint` executable.
   * @returns {string} The path to the `eslint` executable.
   * @memberof ESLintIssueProvider
   */
  getESLint () { return '/usr/local/bin/eslint' } // FIXME

  /**
   * @inheritdoc
   */
  static available (workspace) {
    const root = workspace.path
    const eslintrc = nova.fs.listdir(root).filter(name => name.startsWith('.eslintrc.'))
    if (eslintrc.length) return true

    const packageJSON = nova.path.join(root, 'package.json')
    if (nova.fs.access(packageJSON, nova.fs.R_OK)) {
      const packageData = require(packageJSON)
      return (packageData && packageData.eslintConfig)
    }

    return false
  }

  /**
   * Get issues from building form stdin input. Used to do checking on changes.
   * @function provideIssuesSTDIN
   * @returns {Promise} Asynchronous issues collection.
   * @param {object} editor - The editor instance the validator is called from.
   * @static
   */
  static provideIssuesSTDIN (editor) {
    const file = editor.document.path
    const range = new Range(0, editor.document.length)
    const string = editor.getTextInRange(range)

    return new Promise((resolve, reject) => {
      try {
        const parser = new IssueParser(this.issueMatcher)
        const args = {
          args: ['--format=compact', '--stdin'],
          shell: false
        }
        if (file != null) args.args.push('--stdin-filename', file)
        const eslint = new Process(this.getESLint(), args)
        const stderr = []

        eslint.onStdout(line => parser.pushLine(line))
        eslint.onStderr(line => stderr.push(line))
        eslint.onDidExit(code => {
          if (stderr.length) console.error(stderr.join(''))
          resolve(parser.issues)
        })
        eslint.start()

        const writer = eslint.stdin.getWriter()
        writer.write(string)
        writer.close()
      } catch (err) {
        const msg = IssueProvider.processError(err.message, this.binName)
        reject(msg)
      }
    })
  }

  /**
   * Get issues from building from a file. Used to do checking on save.
   * @function provideIssuesFile
   * @returns {Promise} Asynchronous issues collection.
   * @param {object} editor - The editor instance the validator is called from.
   * @static
   */
  static provideIssuesFile (editor) {
    const file = editor.document.path

    return new Promise((resolve, reject) => {
      try {
        const parser = new IssueParser(this.issueMatcher)
        const args = {
          args: ['--format=compact', file],
          shell: false
        }
        const eslint = new Process(this.getESLint(), args)
        const stderr = []

        eslint.onStdout(line => parser.pushLine(line))
        eslint.onStderr(line => stderr.push(line))
        eslint.onDidExit(code => {
          if (stderr.length) console.error(stderr.join(''))
          resolve(parser.issues)
        })
        eslint.start()
      } catch (err) {
        const msg = IssueProvider.processError(err.message, this.binName)
        reject(msg)
      }
    })
  }
}

module.exports = { ESLintIssueProvider: ESLintIssueProvider }
