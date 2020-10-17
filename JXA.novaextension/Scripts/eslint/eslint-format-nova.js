/**
 * @fileoverview Structured compact formatter for ESLint output parsing in Nova.
 */
'use strict'

/**
 * Returns a canonical error level string based upon the error message passed in.
 * @param {object} message Individual error message provided by `eslint`.
 * @returns {string} Error level string (one of “warning” or “error”).
 */
function getMessageType (message) {
    return (message.fatal || message.severity === 2) ? 'error' : 'warning'
}


module.exports = function (results) {
    const output = []

    results.forEach(result => {
      result.messages.forEach(message => {
        let line = [
          result.filePath,
          message.line || 0,
          message.column || 0,
          message.endLine || message.line || 0,
          message.endColumn || message.column || 0,
          getMessageType(message),
          message.message
        ].join(':')
        if (message.ruleId) line += ` [${message.ruleId}]`

        output.push(line)
      })
    })

    return output.join('\n')
}
