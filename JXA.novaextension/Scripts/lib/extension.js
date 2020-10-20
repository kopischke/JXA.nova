/**
 * @file Extension data not easily retrieved form the global `nova` object.
 */

/**
 * Qualified path to the extension’s script directory.
 * @returns {string} The path.
 */
function scriptDir () {
  const base = nova.path.normalize(nova.extension.path)
  return nova.path.join(base, 'Scripts')
}
exports.scriptDir = scriptDir

/**
 * Qualified path to the extension’s script binaries’ directory.
 * @returns {string} The path.
 */
exports.binDir = function () {
  return nova.path.join(scriptDir(), 'bin')
}

/**
 * Qualified path to the extension’s script library directory.
 * @returns {string} The path.
 */
exports.libDir = function () {
  return nova.path.join(scriptDir(), 'lib')
}
