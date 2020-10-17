/**
 * @file Diagnostics / linting functionality via `eslint`.
 */
const { IssueProvider } = require('./IssueProvider')
const { getLocalConfig, requireJSON } = require('../utils')

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
    this.binName = 'eslint'
  }

  /**
   * Get the path to the `eslint` executable.
   * @returns {string} The path to the `eslint` executable.
   * @memberof ESLintIssueProvider
   */
  get eslint () {
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
   * Set the format used to parse `eslint` output, to the provided custom formatter
   * if available, to the standard 'compact' output otherwise.
   */
  setFormat () {
    let path = nova.path.join(
      nova.extension.path, 'Scripts', 'eslint', 'eslint-format-nova.js'
    )
    path = nova.path.normalize(path)
    if (!nova.fs.access(path, nova.fs.R_OK)) {
      this.issueMatcher = 'jxa-linter-eslint-compact'
      this.eslintFormat = 'compact'
    }
    this.issueMatcher = 'jxa-linter-eslint-nova'
    this.eslintFormat = path
  }

  /**
   * @inheritdoc
   */
  static available (workspace) {
    const root = workspace.path
    const eslintrc = nova.fs.listdir(root).filter(name => name.startsWith('.eslintrc.'))
    if (eslintrc.length) return true

    const packageFile = nova.path.join(root, 'package.json')
    const packageJSON = requireJSON(packageFile)
    if (packageJSON) return packageJSON.eslintConfig != null

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
    let file = editor.document.path
    const range = new Range(0, editor.document.length)
    const string = editor.getTextInRange(range)

    this.setFormat()

    return new Promise((resolve, reject) => {
      try {
        const [bin, args, shell] = this.eslint
        const opts = {
          args: args.concat(['--format', this.eslintFormat, '--stdin']),
          shell: shell
        }

        if (file == null) file = nova.path.join(nova.workspace.path, '_.jxa')
        opts.args.push('--stdin-filename', file)
        const eslint = new Process(bin, opts)
        const stderr = []

        const parser = new IssueParser(this.issueMatcher)

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
    this.setFormat()

    return new Promise((resolve, reject) => {
      try {
        const [bin, args, shell] = this.eslint
        const opts = {
          args: args.concat(['--format', this.eslintFormat, file]),
          shell: shell
        }
        const eslint = new Process(bin, opts)
        const stderr = []

        const parser = new IssueParser(this.issueMatcher)

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
