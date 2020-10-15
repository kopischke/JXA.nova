/**
 * @file Common extension environment functionality.
 */

/**
 * Extension environment data not easily retrieved form the `nova` global object.
 * @property {string} scriptDir - Qualified path to the extension’s script directory.
 * @property {string} binDir - Qualified path to the extension’s script binaries’ directory.
 * @property {string} libDir - Qualified path to the extension’s script library directory.
 */
const extEnv = {
  get scriptDir () {
    const base = nova.path.normalize(nova.extension.path)
    return nova.path.join(base, 'Scripts')
  },
  get binDir () {
    return nova.path.join(this.scriptDir, 'bin')
  },
  get libDir () {
    return nova.path.join(this.scriptDir, 'lib')
  }
}

module.exports = extEnv
