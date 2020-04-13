import * as vscode from 'vscode';
import { LibrarySetting } from './ints';

export class Settings {
    public get settings() {
        let settings = vscode.workspace.getConfiguration('dependencyDebugger');
        return settings;
    }

    // private libs: LibrarySetting[] = [
    // 	{
    //         "name": "@angular/common",
    //         "path": "../test-lib/@angular/common"
    //     }
    // ];

    public getLibs() {
        let libs = this.settings.get<LibrarySetting[]>('libraries');
        if (!libs) {
            return [];
        }
        return libs;
    }


}