# Linera Copilot VS Code Extension

This is a VS Code extension with a webview panel powered by Vue 3, Quasar, and Vite.

## Development

To run the extension in development mode:

1.  Open the `linera-copilot` directory in VS Code.
2.  Run `npm install` in the root directory to install the extension's dependencies.
3.  Run `npm run watch-extension` to compile and watch the extension's code.
4.  In a separate terminal, navigate to the `webview-ui` directory and run `npm run watch-webview` to start the Vite dev server.
5.  Press `F5` in VS Code to open a new Extension Development Host window.
6.  In the Extension Development Host window, open the command palette (`Ctrl+Shift+P`) and run the `Show Linera Copilot` command.

## Production

To package the extension for production:

1.  Run `npm install` in the root directory.
2.  Run `npm run vscode:prepublish` to build the extension and the webview UI.
3.  Run `vsce package` to create a `.vsix` file.
