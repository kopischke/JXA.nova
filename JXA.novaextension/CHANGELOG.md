## Version 1.1.0 and 1.1.1

The tentpole feature of this release is _ESLint_ based linting of JXA files. This simply picks up your existing _ESLint_ configuration and falls back to `osacompile` if there isn’t any. It will hopefully alleviate the fact that the current [_ESLint_ extension](nova://extension/?id=apexskier.eslint) doesn’t work with JXA files; the JXA extension doesn’t try to provide the same level of features, though.

Added:

- _ESLint_ based linting of JXA files. See the README’s **A note on linting** section for details.
- Cascading settings: extension options can now be set at the global level and at the workspace level, with the latter inheriting from, or overriding, the former.

Fixed in 1.1.1:

- A glitch in the README’s A note on linting section.

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
