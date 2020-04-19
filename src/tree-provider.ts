import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { Utils } from './utils';
import { Settings } from './settings';
import { DependencyTreeItem, InfoTreeItem } from './tree-items';
import { PackagesFnc } from './packages-fnc';
import { InstallManager } from './install-manager';

export class TreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor(private workspaceRoot: string) {
        this.packagesFnc = new PackagesFnc(workspaceRoot, this.packageFile);
    }

    private packageFileName = 'package.json';

    private _onDidChangeTreeData: vscode.EventEmitter<DependencyTreeItem | undefined> = new vscode.EventEmitter<DependencyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<DependencyTreeItem | undefined> = this._onDidChangeTreeData.event;

    private settings = new Settings();
    private packagesFnc: PackagesFnc;
    private installs = new InstallManager();


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
        this.installs.start(pckgName);

        this.deletePackageDir(pckgName);

        this.packagesFnc.writePackageVersion(pckgName, version);
        this.updateTree();

        this.singleNpmInstall(pckgName);
    }

    private singleNpmInstall(pckgName: string) {
        this.packagesFnc.installNpmAsync(pckgName)
            .then(() => {
                this.installs.finish(pckgName);                
                this.updateTree();
            })
            .catch((err) => {
                if (this.installs.canRunInstallAttempt(pckgName)) {
                    this.singleNpmInstall(pckgName);
                } else {
                    this.installs.finish(pckgName);
                    this.updateTree();
                }
            });
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
        const packageDir = path.join(this.workspaceRoot, 'node_modules', pckgName);
        rimraf.sync(packageDir);
    }

    public updateTree() {
        this._onDidChangeTreeData.fire();
    }

    private async getLatestPackageVersionAsync(pckgName: string) {
        const latestVersionCmd = `npm view ${pckgName} version`;
        const latest = await Utils.getResultFromCommand(latestVersionCmd);
        return latest.trim();
    }

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

        const libsDefinition = this.settings.getLibs();
        const packagesNames = libsDefinition?.map((l) => { return l.name; });

        const items = packagesNames.map(pckgName => {
            const version = dependencies[pckgName];
            const isBeingUpdated = this.installs.isRunning(pckgName);
            const item = new DependencyTreeItem(pckgName, version, this.cs.Collapsed, isBeingUpdated);
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


