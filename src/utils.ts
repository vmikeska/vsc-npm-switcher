import { exec } from "child_process";

export class Utils {
    public static isNumberVersion(version: string) {
        if (!version) {
            return false;
        }
        
        let prms = version.split('.');
        let lastPrm = prms[prms.length - 1];
        let minorVersion = Number(lastPrm);
        let isValid = !isNaN(minorVersion);
        return isValid;
    }

    public static getResultFromCommand(command: string) {
        return new Promise<string>((success, error) => {
            exec(command, (err: any, stdout: string, stderr: any) => {
                if (err) {                    
                    error(err);
                } else {
                    if (stderr) {
                        error(stderr);
                    }
                    success(stdout);                    
                }
            });
        });                
    }
}