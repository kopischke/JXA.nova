/**
 * @file Diagnostics / linting functionality (abstract base).
 */

class IssueProvider {
  /**
   * Abstract issue provider for the JXA syntax.
   * @param {string} event - one of 'onChange' or 'onSave'
   * @property {Function} provideIssues - the `provideIssues` function; see
   * {@link https://docs.nova.app/api-reference/assistants-registry/#registerissueassistant-selector-object-options}.
   * @property {string} issueMatcher - the `issueMatchers` key in `extension.json` to use;
   * @see {@link https://docs.nova.app/extensions/issue-matchers/}
   * @throws {RangeError} When created with an invalid `event` argument value.`
   * @abstract
   */
  constructor (event) {
    const events = ['onChange', 'onSave']
    if (!events.includes(event)) {
      throw new RangeError('IssueProvider “event” argument must be “onChange” or “onSave”')
    }
    this.provideIssues = null
    this.issueMatcher = null
    this.disposables = new CompositeDisposable()
  }

  /**
   * Create a standard error message and log it to console.
   * @returns {string} The final error message.
   * @param {string} message - The input error message to process.
   * @param {string} source - The source of the input error message.
   * @static
   */
  static processError (message, source) {
    const msg = `Could not get issues from '${source}': ${message}`
    console.error(msg)
    return msg
  }

  /**
   * Check if the IssueProvider is available.
   * @returns {boolean} Whether the IssueProvider is available.
   * @param {object} workspace - The Workspace for which to check availability.
   * @static
   * @abstract
   */
  static available (workspace) { return false }

  /**
   * Conform to Disposable interface.
   * @see {@link https://docs.nova.app/api-reference/disposable/}
   */
  dispose () { this.disposables.dispose() }
}

module.exports = { IssueProvider: IssueProvider }
