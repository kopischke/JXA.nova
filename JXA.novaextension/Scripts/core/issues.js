/**
 * @file Core extension issues functionality.
 */

/**
 * Checks if an issue set differs from the known one.
 * @returns {boolean} Whether the issue sets differ.
 * @param {Array.<?object>} known - The known {@link Issue} set to check against.
 * @param {Array.<?object>} incoming - The incoming {@link Issue} set to check.
 */
exports.changedIssues = function (known, incoming) {
  if (known.length !== incoming.length) return true

  return incoming.some(issue => {
    return !known.some(knownIssue => {
      return (
        knownIssue.message === issue.message &&
        knownIssue.code === issue.code &&
        knownIssue.line === issue.line &&
        knownIssue.column === issue.column &&
        knownIssue.endLine === issue.endLine &&
        knownIssue.endColumn === issue.endColumn &&
        knownIssue.severity === issue.severity
      )
    })
  })
}
