# JavaScript for Automation (JXA) extension for Nova

Make Nova your editor of choice when developing [_JavaScript for Automation_ (JXA)](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-11.html) scripts.

## Features

- Syntax highlighting for JXA globals and ObjC bridge idioms.
- Proper symbolication of the above, including integration into the Symbols pane.
- Completions for JXA globals’ methods and properties.
- Configurable script build and run task templates based on `osacompile` and `osascript`.
- Optional linting of JXA files on save or on change, through _ESlint_ if it is configured for your workspace, else through `osacompile`.
- Commands to send the current file or current selection to the macOS Script Editor. Note you will be prompted by macOS to grant Nova the right to automate Script Editor the first time you run this.
- German localisation.

### A note on linting

This extension does not try to provide a full-fledged _ESLint_ experience. In fact, there would be no _ESLInt_ functionality at all if [the relevant extension](nova://extension/?id=apexskier.eslint) worked reliably for JXA files (see below in the **Caveats* section). As such, installing and configuring _ESLint_ for your project is entirely up to you: the extension simply picks up what is configured anyway.

If you’d rather not go through the motions of doing that for your JXA project, the extension will fall back on `osacompile` for linting: be aware that this is bare bones at best, as it  will only report parsing errors (the first parsing error only, to be precise). If you need to check your coding style, configure _ESLint_ to work with your JXA files (my [shareable JXA ESLint config](https://www.npmjs.com/package/eslint-config-jxa) might help).

### Screenshots

Autocomplete, syntax highlighting and symbolication of JXA and ObjC bridge idioms:

![JXA.nova syntax features](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-syntax-features.png "Autocomplete, syntax highlighting and symbolication of JXA and ObjC bridge idioms.")

Linting with _ESLint_:

![JXA.nova linting feature](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-linting-feature.png "Linting with ESLint.")

Build task settings (showcasing German localisation):

![JXA,nova build task settings](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-task-build-settings.png "Build task settings.")

## Caveats

Currently, there are some oddities you will encounter using this extension you should be aware of:

- The JXA syntax is declared as a sub-syntax of JavaScript; Nova does the right thing and activates extensions claiming to process JavaScript on JXA files. Some of these extensions will still fail to work with JXA files, others will be unreliable. A notable examples of the former is the [_TypeScript Language Server_](nova://extension/?id=apexskier.typescript), one of the latter the [_ESLint_ extension](nova://extension/?id=apexskier.eslint). **Workaround:** temporarily switch to JavaScript via Nova’s syntax picker; for _ESLint_, use JXA’s own support for it.
- When the regular _ESLint_ extension works, it contributes its own set of issues to the Problems pane, which duplicate JXA’s. This mostly only happens for the first active editor window in the workspace, if at all. **Workaround:** close the affected tab, then re-open that file. Usually, the _ESlint_ extension will fail to pick that up and thus not contribute duplicate issues again. Alternately, there is an option to disable JXA’s own ESLint functionality in the extension preferences.
- Syntax highlighting of ObjC constructs seeps into nominally [atomic scopes](https://docs.nova.app/syntax-reference/scopes/#atomic-scopes) like strings and comments (no workaround ATM).

Hop over to the [issues](https://github.com/kopischke/JXA.nova/issues) if you have advice to contribute on any of these issues.

### Caveats for users of elder Nova versions

The following issues have been resolved in current versions of Nova. They are listed for compatibility reasons with elder Nova versions that might stick around when users decide not to pay for updates: 
- **Nova versions 1.0 through 1.2:** Syntax highlighting does not always update when the JXA syntax is applied to an already open file (be it through the syntax picker, or because the extension was installed while the file was open). **Workaround:** open Nova’s preferences and switch your theme to another, then back (you don’t need to close preferences for this to take effect). This will refresh syntax highlighting.
