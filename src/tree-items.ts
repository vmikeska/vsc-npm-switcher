import * as vscode from 'vscode';
import * as path from 'path';
import { Utils } from './utils';

export class DependencyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private isUpdateRunning: boolean
    ) {
        super(label, collapsibleState);
        this.fillIcons();
    }

    public get isPublicPackage() {
        return Utils.isNumberVersion(this.version);
    }

    get tooltip(): string {
        return `${this.label}-${this.version}`;
    }

    get description(): string {
        return this.version;
    }

    private fillIcons() {                
        const icoPath = path.join(__filename, '..', '..', 'resources', this.iconFile);

        this.iconPath = {
            light: icoPath,
            dark: icoPath
        };
    }

    private get iconFile() {
        if (this.isUpdateRunning) {
            return 'hour.png';        
        }

        const isNumberVersion = Utils.isNumberVersion(this.version);
        const regular = isNumberVersion ? 'remote.png' : 'local.png';
        return regular;
    }
}

export class InfoTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }

    get tooltip() {
        return this.label;
    }

    get description() {
        return this.desc;
    }
}


