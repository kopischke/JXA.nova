/**
 * @file Utility extension functions.
 */

/**
 * Get the locally valid configuration setting (workspace if set, else global).
 * @returns {?*} The configuration value (if any).
 * @param {string} key - The configuration key to look up.
 * @param {string} [type] - The type to coerce the configuration value to.
 * @see {@link https://docs.nova.app/api-reference/configuration/}
 */
function getLocalConfig (key, type) {
  const local = nova.workspace.config.get(key, type)
  return local || nova.config.get(key, type)
}

/**
 * Like `require('/path/to/file.json')` in Node.
 * @returns {?object} The contents of package.json (if found).
 * @param {string} path - The path to the JSON file.
 */
function requireJSON (path) {
  if (!nova.fs.access(path, nova.fs.R_OK)) return null
  const lines = nova.fs.open(path).readlines()
  return lines.length > 0 ? JSON.parse(lines.join('\n')) : null
}

module.exports = { getLocalConfig: getLocalConfig, requireJSON: requireJSON }
