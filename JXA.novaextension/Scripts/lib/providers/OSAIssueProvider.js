/**
 * @file Diagnostics / linting functionality using `osacompile`.
 */
const { IssueProvider } = require('./IssueProvider')
const { binDir } = require('../extension')

class OSAIssueProvider extends IssueProvider {
  /**
   * OSA compiler based issue provider for the JXA syntax.
   * Uses the extension provided `jxabuild` script, which in turn uses `osacompile`
   * under the hood; not _that_ useful, but still better than no validation at all.
   * @augments IssueProvider
   * @param {string} event - see {@link IssueProvider}
   */
  constructor (event) {
    super(event)
    switch (event) {
      case 'onChange':
        this.provideIssues = OSAIssueProvider.provideIssuesSTDIN
        break
      case 'onSave':
        this.provideIssues = OSAIssueProvider.provideIssuesFile
        break
    }

    this.issueMatcher = 'jxa-linter-osacompile'

    this.binName = 'jxabuild'
    this.buildDir = nova.path.join(nova.extension.workspaceStoragePath, this.binName)
    const dirStat = nova.fs.stat(this.buildDir)
    if (dirStat != null) {
      console.assert(
        dirStat.isDirectory() && nova.fs.access(this.buildDir, nova.fs.W_OK),
        `Temporary validation path exists, but isn’t a writable directory: ${this.buildDir}`
      )
    }
  }

  /**
   * @inheritdoc
   */
  dispose () {
    nova.fs.rmdir(this.buildDir)
    super.dispose()
  }

  /**
   * @inheritdoc
   */
  static available (workspace) {
    const jxabuild = nova.path.join(binDir, this.binName)
    return nova.fs.access(jxabuild, nova.fs.X_OK)
  }

  /**
   * Get a build process configured and ready.
   * @param {string} forSource - Either the file to compile, or '-' for stdin.
   * @returns {Process} A Nova API process encapsulating the build.
   * @memberof OSAIssueProvider
   */
  getProcess (forSource) {
    const opts = {
      args: [forSource],
      env: { JXABUILD_DIR: this.buildDir, JXABUILD_FORMAT: 'scpt' },
      shell: false
    }
    return new Process(nova.path.join(binDir, this.binName), opts)
  }

  /**
   * Get issues from building form stdin input. Used to do checking on changes.
   * @function provideIssuesSTDIN
   * @returns {Promise} Asynchronous issues collection.
   * @param {object} editor - The editor instance the validator is called from.
   * @static
   */
  static provideIssuesSTDIN (editor) {
    const range = new Range(0, editor.document.length)
    const string = editor.getTextInRange(range)

    return new Promise((resolve, reject) => {
      try {
        const parser = new IssueParser(this.issueMatcher)
        const jxabuild = this.getProcess('-')
        jxabuild.onStderr(line => parser.pushLine(line))
        jxabuild.onDidExit(code => resolve(parser.issues))
        jxabuild.start()

        const writer = jxabuild.stdin.getWriter()
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
        const jxabuild = this.getProcess(file)
        jxabuild.onStderr(line => parser.pushLine(line))
        jxabuild.onDidExit(code => resolve(parser.issues))
        jxabuild.start()
      } catch (err) {
        const msg = IssueProvider.processError(err.message, this.binName)
        reject(msg)
      }
    })
  }
}

module.exports = { OSAIssueProvider: OSAIssueProvider }
