## Version 2.0.0

This version removes built-in ESLint support and rebuilds OSACompile based linting functionality from the ground up. 

**About the removal of the ESLint feature:** This feature was never meant to be; it was created out of frustration that the only available ESLint extension for Nova would not lint JXA files (unless assigned the JavaScript syntax). This fact has not changed, but there now is an alternative in the extension directory: [my own _µESLint_ extension](nova://extension/?id=net.kopischke.eslint) (if you are not reading this in Nova, find it [here](https://extensions.panic.com/extensions/net.kopischke/net.kopischke.eslint/)), which will do, inside Nova, anything ESLint would do on the command line. Including linting JXA files, if so configured.

As it turns out, ESLint has a lot of options, an amazing amount of extensibility and a fair share of corner cases the “official” ESLint extension does not entirely cover. Addressing all of these only for JXA files made less and less sense the more I learned about ESLint, so I spun the feature off into its own extension. I apologise for any inconvenience this causes, and sincerely hope you will find _µESLint_ not just a replacement, but an improvement.

As a side effect of implementing a standalone linting extension, the built-in, OSACompile based linting feature has become much more reliable. Even if you did not use the ESLint option, you should profit from this shift.

**Removed**

- ESLint linting feature and and all its settings.
- Option to lint on save only (that never made much sense anyway).
- Informative pseudo-issues for linters (now there is only one linter in the extension).

**Fixed**

- Build and run tasks would use the last saved state of a file, not its current contents.
- The line index for issues provided by OSACompile was wrong.
- Numerous corner cases and race conditions where outdated issues could clutter the Issues Pane.
- Possible conflicts with other extensions’ settings and / or commands.

**Changed**

- A more polished, higher resolution icon.
- The extension code has been refactored for easier maintenance.
- Localisations have been reworked for better scalability to more languages in the future.

## Version 1.4.0 and 1.4.1

**Added**

- Option to globally disable JXA’s _ESLint_ functionality (i.e., lint with `osascompile` only) in the extension settings.
- Issues reported by `osacompile` are now correctly showing their source as “osacompile”.

**Fixed**

- Issues displayed in the Problems pane would stick around after the document they refer to was closed.
- The `osacompile` linter would not actually check for the presence of an executable for the wrapper script it needs.

**Fixed in 1.4.1**

- Incoherent README “Caveats” section.

**Changed**

- Asynchronous linter management has been refactored, greatly simplifying the linter modules proper.

**Important notice:** I’ve finally figured out why the first open JXA text editor often reports duplicate ESLint issues. Unluckily, I cannot fix this, as that is the “official” [_ESLint_ extension](nova://extension/?id=apexskier.eslint) doing its part (see the “Caveats” section int the [README](nova://extension/?id=net.kopischke.jxa)).


## Version 1.3.0

This release enables Nova’s auto-formatting features for JXA files. For some reason, I assumed this would be inherited from the parent syntax (i.e. JavaScript). I was wrong.

**Added**

- Support for [auto-indentation](https://docs.nova.app/syntax-reference/syntaxes/#indentation-rules) of JXA code.
- Support for [commenting and uncommenting](https://docs.nova.app/syntax-reference/syntaxes/#comment-rules) JXA code.
- Support for [bracket functionality](https://docs.nova.app/syntax-reference/syntaxes/#brackets) in JXA code.
- Support for [surrounding pairs](https://docs.nova.app/syntax-reference/syntaxes/#surrounding-pairs) in JXA code.

## Version 1.2.1 and 1.2.2

Hotfix releases: the extension activation sequence was failing when the extension was not in ad-hoc (developer) mode, which left commands and linting functionality non-functional. The whole sequence is now more robust and should notify users when something went wrong while activating. It should also be slightly faster, as the check for the executable status of the included binaries is now performed asynchronously.

## Version 1.2.0

This is a spit-and-polish release. Behind the scenes, the linting functionality has been entirely refactored, but what you should notice from that is mainly that it works better.

**Added**

- Linters add informative entries to the Problems pane (but only when “real” issues are found). See the screenshot in the [README](nova://extension/?id=net.kopischke.jxa) for an example.
- The Problems pane shows an information message when no linter is available for the open source file.
- The display of informative pseudo-issues (like the two mentioned above) can be disabled globally.
- The stripping of the original source extension when building can be disabled in the task settings.
- A command in the Extensions menu to open the extension’s workspace preferences.

**Fixed**

- The Problems pane could display duplicated issues for the editor that was active when the extension activated.
- Issues displayed in the Problems pane when using on save linting could stick around indefinitely when switching to linting on change.
- _ESLint_ would try to lint files originating outside the workspace, which would fail or have unexpected results ([rules are path specific](https://eslint.org/docs/user-guide/configuring)). The extension now falls back to `osacompile` instead.
- Retrieving a local configuration value derived from a global value would fail for boolean values.

**Changed**

- _ESLint_ linting now directly parses the JSON output. The custom formatter has been removed. As it turns out, that is what all ESLint CLI formatters actually do, so we might as well cut out the middle person.

## Version 1.1.0 and 1.1.1

The tentpole feature of this release is [_ESLint_](https://eslint.org) based linting of JXA files. This simply picks up your existing _ESLint_ configuration and falls back to `osacompile` if there isn’t any. It will hopefully alleviate the fact that the current [_ESLint_ extension](nova://extension/?id=apexskier.eslint) doesn’t work with JXA files; the JXA extension doesn’t try to provide the same level of features, though.

**Added**

- _ESLint_ based linting of JXA files. See the [README](nova://extension/?id=net.kopischke.jxa)’s **A note on linting** section for details.
- Cascading settings: extension options can now be set at the global level and at the workspace level, with the latter inheriting from, or overriding, the former.

**Fixed in 1.1.1**

- A glitch in the README’s **A note on linting** section.

## Version 1.0.3

Hotfix release: correct links to repository and issue tracker.

## Version 1.0.2

**Fixed**

- Source code containing escape characters (e.g. `\n`) in strings, comments and regular expression literals getting mangled when passed via selection to a run task, or when passed to the macOS Script Editor.
- Menu entries for commands not ending with an ellipsis despite opening another app.

**Changed**

- Improved error handling in case the directory used in validation is not accessible.

## Version 1.0.1

**Hotfix release:** ensure included binaries are executable. Fixes tasks, commands and validation failing in 1.0.0.

## Version 1.0.0

Initial release:

- Syntax highlighting for JXA globals and ObjC bridge idioms.
- Proper symbolication of the above, including integration in the Symbols pane.
- Completions for JXA globals’ methods and properties.
- Configurable script build and run task templates based on `osacompile` and `osascript`.
- Optional validation of JXA files through `osacompile`, on save or on change.
- Commands to send the current file or current selection to the macOS Script Editor.
