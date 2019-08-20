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
            // MSBuild is not a tool we download
            // as Visual Studio is installed on Windows machines
            // However we need to download & use VSWhere to tell us
            // where MSBuild is so we can add it that dir to the PATH
            // Tripple check it's Windows process
            // Can't install VSWhere.exe for Ubuntu image etc..
            const IS_WINDOWS = process.platform === 'win32';
            if (IS_WINDOWS === false) {
                core.setFailed("MSBuild.exe only works for Windows.");
                return;
            }
            // Try & find tool in cache
            let directoryToAddToPath;
            directoryToAddToPath = yield tc.find("vswhere", "2.7.1");
            if (directoryToAddToPath) {
                core.debug(`Found local cached tool at ${directoryToAddToPath} adding that to path`);
                var msBuildPath = yield FindMSBuild(directoryToAddToPath);
                core.debug(`MSBuildPath == ${msBuildPath}`);
                // Add folder where MSBuild lives to the PATH
                yield core.addPath(msBuildPath);
                return;
            }
            // Download VSWhere 2.7.1 release
            core.debug("Downloading VSWhere v2.7.1 tool");
            const vsWherePath = yield tc.downloadTool("https://github.com/microsoft/vswhere/releases/download/2.7.1/vswhere.exe");
            // Rename the file which is a GUID without extension
            var folder = path.dirname(vsWherePath);
            var fullPath = path.join(folder, "vswhere.exe");
            fs.renameSync(vsWherePath, fullPath);
            //Cache the directory with VSWhere in it - which returns a NEW cached location
            var cachedToolDir = yield tc.cacheDir(folder, "vswhere", "2.7.1");
            core.debug(`Cached Tool Dir ${cachedToolDir}`);
            var msBuildPath = yield FindMSBuild(cachedToolDir);
            core.debug(`MSBuildPath == ${msBuildPath}`);
            // Add folder where MSBuild lives to the PATH
            yield core.addPath(msBuildPath);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
function FindMSBuild(pathToVSWhere) {
    return __awaiter(this, void 0, void 0, function* () {
        var msBuildPath = "";
        const options = {};
        options.listeners = {
            stdout: (data) => {
                var output = data.toString();
                msBuildPath += output;
            }
        };
        // Run VSWhere to tell us where MSBuild is
        var vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
        yield exec.exec(vsWhereExe, ['-latest', '-requires', 'Microsoft.Component.MSBuild', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe'], options);
        if (msBuildPath === "") {
            core.setFailed("Unable to find MSBuild.exe");
        }
        var folderForMSBuild = path.dirname(msBuildPath);
        core.debug(`MSBuild = ${msBuildPath}`);
        core.debug(`Folder for MSBuild ${folderForMSBuild}`);
        return folderForMSBuild;
    });
}
