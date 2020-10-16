/**
 * @file Diagnostics / linting functionality.
 */
const { binDir } = require('./extension')

class JXAValidator {
  /**
   * Issue validator for the JXA syntax in Nova.
   * Uses the extension provided `jxabuild` script, which in turn uses `osacompile`
   * under the hood; not _that_ useful, but still better than no validation at all.
   * @class JXAValidator
   * @param {string} event - one of 'onChange' or 'onSave'
   * @property {Function} provideIssues - the `provideIssues` function; see
   * {@link https://docs.nova.app/api-reference/assistants-registry/#registerissueassistant-selector-object-options}..
   * @property {string} issueMatcher - the `issueMatchers` key in `extension.json` to use.
   * @property {string} buildDir - the Location of build output files (`osacompile` cannot
   * compile a script without generating output somewhere).
   * @throws {RangeError} When created with an invalid `event` argument value.`
   */
  constructor (event) {
    switch (event) {
      case 'onChange':
        this.provideIssues = JXAValidator.provideIssuesSTDIN
        break
      case 'onSave':
        this.provideIssues = JXAValidator.provideIssuesFile
        break
      default:
        throw new RangeError('JXAValidator “event” argument must be “onChange” or “onSave”')
    }

    this.issueMatcher = 'jxa-linter-osacompile'

    this.buildDir = nova.path.join(nova.extension.workspaceStoragePath, 'jxabuild')
    const dirStat = nova.fs.stat(this.buildDir)
    if (dirStat != null) {
      console.assert(
        dirStat.isDirectory() && nova.fs.access(this.buildDir, nova.fs.W_OK),
        `Temporary validation path exists, but isn’t a writable directory: ${this.buildDir}`
      )
    }
  }

  /**
   * Support for the `Disposable` interface. Removes the `buildDir` directory.
   * @see {@link https://docs.nova.app/api-reference/disposable/}
   * @memberof JXAValidator
   */
  dispose () { nova.fs.rmdir(this.buildDir) }

  /**
   * Get a build process configured and ready.
   * @param {string} forSource - Either the file to compile, or '-' for stdin.
   * @returns {Process} A Nova API process encapsulating the build.
   * @memberof JXAValidator
   */
  getProcess (forSource) {
    const args = {
      args: [forSource],
      env: { JXABUILD_DIR: this.buildDir, JXABUILD_FORMAT: 'scpt' },
      shell: false
    }
    return new Process(nova.path.join(binDir, 'jxabuild'), args)
  }

  /**
   * Common error message prefix for getters (for DRY’s sake).
   * @type {string} errPrefix
   * @memberof JXAValidator
   * @static
   */
  static get errPrefix () { return 'Could not get issues from `osacompile`' }

  /**
   * Get issues from building form stdin input. Used to do checking on changes.
   * @function provideIssuesSTDIN
   * @returns {Promise} Asynchronous issues collection.
   * @param {object} editor - The editor instance the validator is called from.
   * @memberof JXAValidator
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
        const msg = `${JXAValidator.errPrefix}: ${err.message}`
        console.error(msg)
        reject(msg)
      }
    })
  }

  /**
   * Get issues from building from a file. Used to do checking on save.
   * @function provideIssuesFile
   * @returns {Promise} Asynchronous issues collection.
   * @param {object} editor - The editor instance the validator is called from.
   * @memberof JXAValidator
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
        const msg = `${JXAValidator.errPrefix}: ${err.message}`
        console.error(msg)
        reject(msg)
      }
    })
  }
}

module.exports = { JXAValidator: JXAValidator }
