/**
 * @file Commands functionality.
 */
const { binDir } = require('./extension')

/**
 * Send the JXA code of the current editor to macOS’ Script Editor.
 * @param {string} source - The JXA source to send to Script Editor.
 */
function jxaToEditor (source) {
  const escape = /(`|\$\{|\\[nr])/g
  const script = [
    'const edi = Application("Script Editor")',
    'const doc = edi.make({ new: "document" })',
    'doc.contents = `' + source.replace(escape, '\\\\$1') + '`',
    'edi.activate()',
    'doc.checkSyntax()'
  ]

  const args = {
    args: ['-'],
    env: { JXARUN_CODE: `${script.join('\n')}` }
  }

  const runner = new Process(nova.path.join(binDir, 'jxarun'), args)
  const stderr = []
  runner.onStderr(line => stderr.push(line))
  runner.onDidExit(code => { if (code > 0) console.error(stderr.join('')) })
  runner.start()
}

module.exports = { jxaToEditor: jxaToEditor }
