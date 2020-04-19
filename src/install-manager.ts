import _ from 'lodash';
import { Settings } from './settings';

export class InstallManager {
    public items: InstallItem[] = [];

    private settings = new Settings();

    public start(name: string) {
        let i: InstallItem = {
            name,
            runs: 0
        };
        this.items.push(i);
        return i;
    }

    public get(name: string) {
        let i = this.items.find((i) => { return i.name === name; });
        return i;
    }

    public isRunning(name: string) {
        let i = this.get(name);
        return !!i;
    }

    public canRunInstallAttempt(name: string) {
        let i = this.get(name);
        if (i) {
            i.runs++;
            let canRun = i.runs <= this.settings.maxInstallAttempts;
            return canRun;
        }
        
        return false;
    }

    public finish(name: string) {
        let i = this.get(name);
        if (i) {
            _.pull(this.items, i);
        }
    }
}

export interface InstallItem {
    name: string;
    runs: number;
}