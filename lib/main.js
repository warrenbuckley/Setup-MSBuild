"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // CSC is not a tool we download
            // as Visual Studio is installed on Windows machines
            // However we need to download & use VSWhere to tell us
            // where CSC is so we can add it that dir to the PATH
            // Tripple check it's Windows process
            let cscPath;
            // Can't install VSWhere.exe for Ubuntu image etc..
            const IS_WINDOWS = process.platform === 'win32';
            if (!IS_WINDOWS) {
                core.setFailed("CSC.exe only works for Windows.");
                return;
            }
            // Try & find tool in cache
            let directoryToAddToPath;
            directoryToAddToPath = yield tc.find("vswhere", "2.7.1");
            if (directoryToAddToPath) {
                core.debug(`Found local cached tool at ${directoryToAddToPath} adding that to path`);
                cscPath = yield FindCSC(directoryToAddToPath);
                core.debug(`CSCPath == ${cscPath}`);
                // Add folder where CSC lives to the PATH
                yield core.addPath(cscPath);
                return;
            }
            // Download VSWhere 2.7.1 release
            core.debug("Downloading VSWhere v2.7.1 tool");
            const vsWherePath = yield tc.downloadTool("https://github.com/microsoft/vswhere/releases/download/2.7.1/vswhere.exe");
            // Rename the file which is a GUID without extension
            const folder = path.dirname(vsWherePath);
            const fullPath = path.join(folder, "vswhere.exe");
            fs.renameSync(vsWherePath, fullPath);
            //Cache the directory with VSWhere in it - which returns a NEW cached location
            const cachedToolDir = yield tc.cacheDir(folder, "vswhere", "2.7.1");
            core.debug(`Cached Tool Dir ${cachedToolDir}`);
            cscPath = yield FindCSC(cachedToolDir);
            core.debug(`CSCPath == ${cscPath}`);
            // Add folder where CSC lives to the PATH
            yield core.addPath(cscPath);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
function FindCSC(pathToVSWhere) {
    return __awaiter(this, void 0, void 0, function* () {
        let cscPath = "";
        const options = {};
        options.listeners = {
            stdout: (data) => {
                const output = data.toString();
                cscPath += output;
            }
        };
        // Run VSWhere to tell us where CSC is
        const vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
        yield exec.exec(vsWhereExe, ['-latest', '-requires', 'Microsoft.VisualStudio.Component.Roslyn.Compiler', '-find', 'MSBuild\\**\\CSC.exe'], options);
        if (cscPath === "") {
            core.setFailed("Unable to find CSC.exe");
        }
        const folderForCSC = path.dirname(cscPath);
        core.debug(`CSC = ${cscPath}`);
        core.debug(`Folder for CSC ${folderForCSC}`);
        return folderForCSC;
    });
}
