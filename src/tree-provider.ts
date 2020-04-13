import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { Utils } from './utils';
import { Settings } from './settings';
import { DependencyTreeItem, InfoTreeItem } from './tree-items';
import { PackagesFnc } from './packages-fnc';

export class TreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor(private workspaceRoot: string) {
        this.packagesFnc = new PackagesFnc(workspaceRoot, this.packageFile);
    }

    private packageFileName = 'package.json';

    private _onDidChangeTreeData: vscode.EventEmitter<DependencyTreeItem | undefined> = new vscode.EventEmitter<DependencyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<DependencyTreeItem | undefined> = this._onDidChangeTreeData.event;

    private settings = new Settings();
    private packagesFnc: PackagesFnc;
    private updatedPackageName = '';

    private get packageFile() {
        const p = path.join(this.workspaceRoot, this.packageFileName);
        return p;
    }

    private cs = vscode.TreeItemCollapsibleState;
    
    getTreeItem(element: DependencyTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element: DependencyTreeItem): Promise<vscode.TreeItem[]> {

        const isRootPackage = !element;

        if (isRootPackage) {

            const rootPackageFound = this.pathExists(this.packageFile);
            if (!rootPackageFound) {
                vscode.window.showInformationMessage('Workspace has no package file');
                return Promise.resolve([]);
            }

            return Promise.resolve(
                this.getDepsInPackageJson(this.packageFile)
            );
        } else {
            const latestVersion = await this.getLatestPackageVersionAsync(element.label);

            const item = new InfoTreeItem('latest remote version', latestVersion, this.cs.None);
            return Promise.resolve([item]);
        }
    }

    public toLocal(treeItem: DependencyTreeItem) {
        const pckgName = treeItem.label;
        const libDir = this.getLocalLibDir(pckgName);
        const libPath = `file:${libDir}`;
        this.switchPackageAsync(pckgName, libPath);
    }

    public async toRemoteLatest(treeItem: DependencyTreeItem) {
        const pckgName = treeItem.label;
        const latestVersion = await this.getLatestPackageVersionAsync(pckgName);
        this.switchPackageAsync(pckgName, latestVersion);
    }

    public async toRemoteCustom(treeItem: DependencyTreeItem) {
        const pckgName = treeItem.label;

        const options: vscode.InputBoxOptions = {
            prompt: "Type version, eg. 1.0.0",
            placeHolder: "npm package version"
        };

        const version = await vscode.window.showInputBox(options);
        if (version) {
            this.switchPackageAsync(pckgName, version);
        }
    }

    private async switchPackageAsync(pckgName: string, version: string) {

        this.updatedPackageName = pckgName;

        this.deletePackageDir(pckgName);

        this.packagesFnc.writePackageVersion(pckgName, version);
        this.packagesFnc.installNpmAsync(pckgName)
            .then(() => {
                this.updatedPackageName = '';
                this.updateTree();
            })
            .catch((err) => {
                this.updatedPackageName = '';
                this.updateTree();
            });
        this.updateTree();
    }

    private getLocalLibDir(pckgName: string) {
        let libs = this.settings.getLibs();

        if (!libs) {
            return null;
        }

        let lib = libs.find((l) => { return l.name === pckgName; });
        if (!lib) {
            //todo: msg missing configuration
            return null;
        }

        return lib.path;
    }

    private deletePackageDir(pckgName: string) {
        let packageDir = path.join(this.workspaceRoot, 'node_modules', pckgName);
        rimraf.sync(packageDir);
    }

    private updateTree() {
        this._onDidChangeTreeData.fire();
    }

    private async getLatestPackageVersionAsync(pckgName: string) {
        const latestVersionCmd = `npm view ${pckgName} version`;
        let latest = await Utils.getResultFromCommand(latestVersionCmd);
        return latest.trim();
    }

    /**
     * Given the path to test-package.json, read all its dependencies and devDependencies.
     */
    private getDepsInPackageJson(packageJsonPath: string) {
        const pathExists = this.pathExists(packageJsonPath);
        if (!pathExists) {
            return [];
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        const deps = this.getPackages(packageJson.dependencies);
        return deps;
    }

    private getPackages(dependencies: any) {
        if (!dependencies) {
            return [];
        }

        // const packagesNames = Object.keys(dependencies);
        const libsDefinition = this.settings.getLibs();
        const packagesNames = libsDefinition?.map((l) => { return l.name; });


        let items = packagesNames.map(npmPackageName => {
            const version = dependencies[npmPackageName];
            const isBeingUpdated = this.updatedPackageName === npmPackageName;
            const item = new DependencyTreeItem(npmPackageName, version, this.cs.Collapsed, isBeingUpdated);
            return item;
        });
        return items;
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }
}


