// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeProvider } from './tree-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "env-switcher" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('env-switcher.helloWorld', async () => {
	// 	// The code you place here will be executed every time your command is executed

	// 	// Display a message box to the user


	// 	let files = await vscode.window.showOpenDialog({});
	// 	if (files) {
	// 		let file = files[0];
	// 		let str = file.toString();
	// 		vscode.window.showInformationMessage(str);
	// 	}		
		
	// });

	let folderPath = vscode.workspace.rootPath;
	if (!folderPath) {
		return;
	}

	let tv = new TreeProvider(folderPath);
	// let tv = new TreeProvider(`C:\\S\\vsc-plugin\\test-project`);

	vscode.window.registerTreeDataProvider('npm-switcher', tv);

	

	vscode.commands.registerCommand('npm-switcher.toLocal', (args) => tv.toLocal(args));
	vscode.commands.registerCommand('npm-switcher.toRemoteLatest', (args) => tv.toRemoteLatest(args));
	vscode.commands.registerCommand('npm-switcher.toRemoteCustom', (args) => tv.toRemoteCustom(args));

	//todo:
	// context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

