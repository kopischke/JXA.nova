# JavaScript for Automation (JXA) extension for Nova

Make Nova your editor of choice when developing [_JavaScript for Automation_ (JXA)](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-11.html) scripts.

## Features

- Syntax highlighting for JXA globals and ObjC bridge idioms.
- Proper symbolication of the above, including integration into the Symbols pane.
- Completions for JXA globals’ methods and properties.
- Configurable script build and run task templates based on `osacompile` and `osascript`.
- Optional validation of JXA files through `osacompile`, on save or on change.
- Commands to send the current file or current selection to the macOS Script Editor. Note you will be prompted by macOS to grant Nova the right to automate Script Editor the first time you run this.
- German localisation.

## Screenshots

![JXA.nova syntax features](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-syntax-features.png)

![JXA.nova diagnostics feature](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-diagnostics-feature.png)

![JXA,nova build task settings](https://raw.githubusercontent.com/kopischke/JXA.nova/main/img/jxa-task-build-settings.png)

## Caveats

As of Nova 1.2, there are a few limitations to this extension’s functionality:

- Despite declaring its syntax definition as a sub-syntax of JavaScript, extensions that activate only for JavaScript files (like [_ESLint_](nova://extension/?id=apexskier.eslint&name=ESLint) or the [_TypeScript Language Server_](nova://extension/?id=apexskier.typescript&name=TypeScript)) will not currently activate for JXA files. **Workaround:** temporarily switch to JavaScript via Nova’s syntax picker to use those.
- Syntax highlighting of ObjC constructs seeps into nominally atomic scopes like strings and comments (no workaround ATM).
