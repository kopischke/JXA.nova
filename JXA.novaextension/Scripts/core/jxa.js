/**
 * @file Core extension JXA / OSAScript functionality.
 * @external ProcessResult
 */
const { runAsync } = require('../lib/process')

/**
 * OSA binaries paths.
 */
const osacompile = '/usr/bin/osacompile'
const osascript = '/usr/bin/osascript'

/**
 * Compile JXA code.
 * @returns {ProcessResult} The results of the `runAsync()` call.
 * @param {string} code - The code to execute.
 * @param {string} target - The path to the compiled file.
 * @param {?object} options - Compile options.
 * @param {?boolean} options.exeOnly - Compile as execute-only.
 * @param {?boolean} options.stayOpen - Compile as stay-open applet.
 * @param {?boolean} options.splashScreen - Use startup screen.
 * @throws {TypeError} When arguments are invalid.
 */
exports.compileJXA = async function (code, target, options) {
  if (code == null || !code.length) throw new TypeError('No JXA code to compile')
  if (target == null) throw new TypeError('Target path for compiled script missing')

  if (options == null) options = {}
  if (typeof options !== 'object' && !Array.isArray(options)) {
    throw new TypeError(`Invalid options argument “${options}”`)
  }

  const args = ['-l', 'JavaScript', '-o', target]
  if (options.exeOnly) args.push('-x')
  if (options.stayOpen) args.push('-s')
  if (options.splshScreen) args.push('-u')

  const opts = { args: args.concat('-') }
  return await runAsync(osacompile, opts, code)
}

/**
 * Run JXA code.
 * @returns {ProcessResult} The results of the `runAsync()` call.
 * @param {string} code - The code to execute.
 * @param {?object} options - Execution options.
 * @param {?boolean} options.recompilableOutput - Print values in recompilable source form.
 * @param {?boolean} options.scriptErrorsToStdout - Print script errors to stdout.
 * @throws {TypeError} When arguments are invalid.
 */
exports.runJXA = async function (code, options) {
  if (code == null || !code.length) throw new TypeError('No JXA code to run')
  if (options == null) options = {}
  if (typeof options !== 'object' && !Array.isArray(options)) {
    throw new TypeError(`Invalid options argument “${options}”`)
  }

  const args = ['-l', 'JavaScript']
  if (options.recompilableOutput || options.scriptErrorsToStdout) args.push('-s')
  if (options.recompilableOutput) args.push('s')
  if (options.scriptErrorsToStdout) args.push('o')

  const opts = { args: args.concat('-') }
  return await runAsync(osascript, opts, code)
}
