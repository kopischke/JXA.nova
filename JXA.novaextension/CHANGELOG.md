## Version 1.2.1 and 1.2.2

Hotfix releases: the extension activation sequence was failing when the extension was not in ad-hoc (developer) mode, which left commands and linting functionality non-functional. The whole sequence is now more robust and should notify users when something went wrong while activating. It should also be slightly faster, as the check for the executable status of the included binaries is now performed asynchronously.

## Version 1.2.0

This is a spit-and-polish release. Behind the scenes, the linting functionality has been entirely refactored, but what you should notice from that is mainly that it works better.

Added:

- Linters add informative entries to the Problems pane (but only when “real” issues are found). See the screenshot in the [README](nova://extension/?id=net.kopischke.jxa) for an example.
- The Problems pane shows an information message when no linter is available for the open source file.
- The display of informative pseudo-issues (like the two mentioned above) can be disabled globally.
- The stripping of the original source extension when building can be disabled in the task settings.
- A command in the Extensions menu to open the extension’s workspace preferences.

Fixed:

- The Problems pane could display duplicated issues for the editor that was active when the extension activated.
- Issues displayed in the Problems pane when using on save linting could stick around indefinitely when switching to linting on change.
- _ESLint_ would try to lint files originating outside the workspace, which would fail or have unexpected results ([rules are path specific](https://eslint.org/docs/user-guide/configuring)). The extension now falls back to `osacompile` instead.
- Retrieving a local configuration value derived from a global value would fail for boolean values.

Other changes:

- _ESLint_ linting now directly parses the JSON output. The custom formatter has been removed. As it turns out, that is what all ESLint CLI formatters actually do, so we might as well cut out the middle person.

## Version 1.1.0 and 1.1.1

The tentpole feature of this release is [_ESLint_](https://eslint.org) based linting of JXA files. This simply picks up your existing _ESLint_ configuration and falls back to `osacompile` if there isn’t any. It will hopefully alleviate the fact that the current [_ESLint_ extension](nova://extension/?id=apexskier.eslint) doesn’t work with JXA files; the JXA extension doesn’t try to provide the same level of features, though.

Added:

- _ESLint_ based linting of JXA files. See the [README](nova://extension/?id=net.kopischke.jxa)’s **A note on linting** section for details.
- Cascading settings: extension options can now be set at the global level and at the workspace level, with the latter inheriting from, or overriding, the former.

Fixed in 1.1.1:

- A glitch in the README’s **A note on linting** section.

## Version 1.0.3

Hotfix release: correct links to repository and issue tracker.

## Version 1.0.2

Fixes:

- Source code containing escape characters (e.g. `\n`) in strings, comments and regular expression literals getting mangled when passed via selection to a run task, or when passed to the macOS Script Editor.
- Menu entries for commands not ending with an ellipsis despite opening another app.

Other changes:

- Improved error handling in case the directory used in validation is not accessible.

## Version 1.0.1

Hotfix release: ensure included binaries are executable. Fixes tasks, commands and validation failing in 1.0.0.

## Version 1.0.0

Initial release:

- Syntax highlighting for JXA globals and ObjC bridge idioms.
- Proper symbolication of the above, including integration in the Symbols pane.
- Completions for JXA globals’ methods and properties.
- Configurable script build and run task templates based on `osacompile` and `osascript`.
- Optional validation of JXA files through `osacompile`, on save or on change.
- Commands to send the current file or current selection to the macOS Script Editor.
