import * as vscode from 'vscode';

import * as revealModule from './modules/reveal';
import * as markAsModule from './modules/mark-as';
import * as rainbowTags from './modules/rainbow-tags';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('zede-jetbrains-helper.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from jetbrains-helper!');
	});

	revealModule.activate(context);
	markAsModule.activate(context);
	rainbowTags.activate(context);

	context.subscriptions.push(disposable);
}

export function deactivate() {}
