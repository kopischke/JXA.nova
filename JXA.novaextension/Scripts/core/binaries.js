/**
 * @file Core extension binaries functionality.
 */
const { runAsync } = require('../lib/process')

/**
 * Ensure binaries are executable.
 * @returns {number} The number of `chmod`ed binaries.
 * @param {string|Array.<string>} paths - The binary paths to check.
 * @throws {Error} When any of the extension binaries cannot be located
 * or the `chmod` operation returns a code > 0.
 */
exports.makeExecutable = async function (paths) {
  const nonexec = []
  const binpaths = [].concat(paths)
  binpaths.forEach(path => {
    if (!nova.fs.access(path, nova.fs.F_OK)) {
      const msg = `Can’t locate extension binaries at path “${path}”.`
      throw new Error(msg)
    }
    if (!nova.fs.access(path, nova.fs.X_OK)) nonexec.push(path)
  })

  if (nonexec.length) {
    const options = { args: ['+x'].concat(nonexec) }
    const results = await runAsync('/bin/chmod', options)
    if (results.code > 0) throw new Error(results.stderr)
  }
  return nonexec.length
}
