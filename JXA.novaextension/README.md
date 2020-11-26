# JavaScript for Automation (JXA) extension for Nova

Make Nova your editor of choice when developing [_JavaScript for Automation_ (JXA)](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-11.html) scripts.

## Features

- Syntax highlighting for JXA globals and ObjC bridge idioms.
- Proper symbolication of the above, including integration into the Symbols pane.
- Completions for JXA globals’ methods and properties.
- Configurable script build and run task templates based on `osacompile` and `osascript`.
- Optional linting of JXA files on change through `osacompile`.
- Commands to send the current file or current selection to the macOS Script Editor. Note you will be prompted by macOS to grant Nova the right to automate Script Editor the first time you run this.
- German localisation.

### Screenshots

Autocomplete, syntax highlighting and symbolication of JXA and ObjC bridge idioms:

![JXA.nova syntax features](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-syntax-features.png "Autocomplete, syntax highlighting and symbolication of JXA and ObjC bridge idioms.")

Build task settings (showcasing German localisation):

![JXA,nova build task settings](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-task-build-settings.png "Build task settings.")

## Requirements

None. JXA and its toolchain are integral parts of the macOS system.

## Known issues

Currently, there are some oddities you will encounter using this extension you should be aware of:

- The JXA syntax is declared as a sub-syntax of JavaScript. Nova does the right thing and activates extensions claiming to process JavaScript on JXA files, but some of these extensions will still fail to work with JXA files, and others will be unreliable. A notable examples of the former is the [_TypeScript Language Server_](nova://extension/?id=apexskier.typescript), one of the latter the [_ESLint_ extension](nova://extension/?id=apexskier.eslint). **Workaround:** temporarily switch to JavaScript via Nova’s syntax picker; for _ESLint_, use [my _µESLint_ extension](nova://extension/?id=net.kopischke.eslint).
- Syntax highlighting of ObjC constructs seeps into nominally [atomic scopes](https://docs.nova.app/syntax-reference/scopes/#atomic-scopes) like strings and comments (no workaround ATM).

Hop over to the [issues](https://github.com/kopischke/JXA.nova/issues) if you have advice to contribute on any of these issues.

### Nova versions 1.0 through 1.2 only

On Novae versions before 2, syntax highlighting does not always update when the JXA syntax is applied to an already open file (be it through the syntax picker, or because the extension was installed while the file was open). **Workaround:** open Nova’s preferences and switch your theme to another, then back (you don’t need to close preferences for this to take effect). This will refresh syntax highlighting.
