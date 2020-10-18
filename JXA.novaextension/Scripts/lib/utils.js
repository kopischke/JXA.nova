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

/**
 * Shim for the `Workspace.contains` instance method; as of Nova 1.2,
 * that always returns true and `Workspace.relativizePath` always returns
 * a relative path, with as many  '../' as needed.
 * @see {@link https://docs.nova.app/api-reference/workspace/#contains-path}
 * @see {@link https://docs.nova.app/api-reference/workspace/#relativizepath-path}
 * @returns {boolean} Whether the path is inside the workspace’s directory hierarchy.
 * @param {object} workspace - The workspace to check.
 * @param {string} path - The path to object to check.
 */
function workspaceContains (workspace, path) {
  const relative = workspace.relativizePath(path)
  return relative !== path && !relative.startsWith('../')
}

module.exports = {
  getLocalConfig: getLocalConfig,
  requireJSON: requireJSON,
  workspaceContains: workspaceContains
}
