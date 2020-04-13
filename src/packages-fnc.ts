import { Utils } from "./utils";
import * as vscode from 'vscode';
import * as fs from 'fs';

export class PackagesFnc {
    constructor(
        private workspaceRoot: string,
        private packageFile: string
    ) {}


    private infoMsg = vscode.window.showInformationMessage;
    private errorMsg = vscode.window.showErrorMessage;

    public async installNpmAsync(pckgName: string, isLocal = true) {
        let cmd = `cd ${this.workspaceRoot} && npm i ${pckgName} --loglevel=error --force`;
        return new Promise((success, error) => {
            Utils.getResultFromCommand(cmd)
            .then(() => {
                this.infoMsg(`Package ${pckgName} was successfully updated.`);
                success();
            })
            .catch((err) => {
                this.errorMsg(`Package ${pckgName} failed. - ${err}`);
                error(err);
            });
        });
    }

    public writePackageVersion(pckgName: string, value: string) {
        const file = require(this.packageFile);
        file.dependencies[pckgName] = value;

        fs.writeFile(this.packageFile, JSON.stringify(file, null, 2), (err) => {
            if (err) { return console.log(err); };
        });

    }
}