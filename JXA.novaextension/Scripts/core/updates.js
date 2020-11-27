/**
 * @file Core update migration functionality.
 */
const ext = require('../lib/extension')

/**
 * Handle update migrations of extension features and settings.
 * @param {string} version - The Version updated to, in “vX.Y.Z” format.
 */
exports.updateTo = function (version) {
  const confPrefix = ext.prefixConfig()
  const msgPrefix = ext.prefixMessage()
  const outdated = []
  let key

  switch (version) {
    case 'v2.0.0':
      key = `${confPrefix}.updated.${version}`
      if (!nova.config.get(key)) {
        if (nova.config.get('jxa.linting.mode') !== 'off') {
          nova.config.set(`${confPrefix}.linting`, true)
        }

        if (!nova.config.get('jxa.linting.eslint-off', 'boolean')) {
          const info = new NotificationRequest(`${msgPrefix}.eslint-removal`)
          info.title = nova.localize(nova.extension.name)
          info.body = nova.localize(`${msgPrefix}.eslint-removal`)
          info.actions = [
            nova.localize(`${msgPrefix}.action.more-info`),
            nova.localize(`${msgPrefix}.action.install-eslint`)
          ]

          nova.notifications.add(info)
            .then(reply => {
              switch (reply.actionIdx) {
                case 0:
                  nova.extension.openChangelog()
                  break
                case 1:
                  nova.openURL('nova://extension/?id=net.kopischke.eslint')
                  break
              }
            })
            .catch(console.error)
        }

        outdated.push(
          'jxa.linting.mode',
          'jxa.linting.hide-info',
          'jxa.linting.eslint-off',
          'jxa.linting.eslint-binary'
        )

        nova.config.set(key, true)
      }
  }

  if (outdated.length) {
    outdated.forEach(key => {
      nova.config.remove(key)
      nova.workspace.config.remove(key)
    })
  }
}
