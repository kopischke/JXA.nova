/**
 * @file Core extension commands functionality.
 */
const { runJXA } = require('./jxa')

/**
 * Send the JXA code of the current editor to macOS’ Script Editor.
 * @param {string} source - The JXA source to send to Script Editor.
 */
exports.toScriptEditor = async function (source) {
  // We have to do a little dance to get all code properly into Script Editor:
  // - using a raw template string ensures Script Editor leaves literal '\n' and such alone;
  // - the `escaped` step makes sure the source does not break out of the template string;
  // - the final `replace` removes these escapes once the code has landed in Script Editor.
  const escaped = source.replace(/(`|\$\{)/g, '\\$1')
  const script = [
    'const edi = Application("Script Editor")',
    'const doc = edi.make({ new: "document" })',
    'doc.contents = String.raw`' + escaped + '`.replace(/\\\\(`|\\$\\{)/g, "$1")',
    'edi.activate()',
    'doc.checkSyntax()'
  ]

  const { code, stderr } = await runJXA(script.join('\n'))
  if (code > 0) console.error(stderr)
}
