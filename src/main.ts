import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { ExecOptions } from '@actions/exec/lib/interfaces';

async function run() {
  try {

    // CSC is not a tool we download
    // as Visual Studio is installed on Windows machines
    // However we need to download & use VSWhere to tell us
    // where CSC is so we can add it that dir to the PATH

    // Triple check it's Windows process
    let cscPath;
// Can't install VSWhere.exe for Ubuntu image etc..
    const IS_WINDOWS = process.platform === 'win32';
    if(!IS_WINDOWS){
      core.setFailed("CSC.exe only works for Windows.");
      return;
    }

    // Try & find tool in cache
    let directoryToAddToPath:string;
    directoryToAddToPath = await tc.find("vswhere", "2.7.1");

    if(directoryToAddToPath){
      core.debug(`Found local cached tool at ${directoryToAddToPath} adding that to path`);

      cscPath = await FindCSC(directoryToAddToPath);
      core.debug(`CSCPath == ${cscPath}`);

      // Add folder where CSC lives to the PATH
      await core.addPath(cscPath);
      return;
    }

    // Download VSWhere 2.7.1 release
    core.debug("Downloading VSWhere v2.7.1 tool");
    const vsWherePath = await tc.downloadTool("https://github.com/microsoft/vswhere/releases/download/2.7.1/vswhere.exe");

    // Rename the file which is a GUID without extension
    const folder = path.dirname(vsWherePath);
    const fullPath = path.join(folder, "vswhere.exe");
    fs.renameSync(vsWherePath, fullPath);

    //Cache the directory with VSWhere in it - which returns a NEW cached location
    const cachedToolDir = await tc.cacheDir(folder, "vswhere", "2.7.1");
    core.debug(`Cached Tool Dir ${cachedToolDir}`);

    cscPath = await FindCSC(cachedToolDir);
    core.debug(`CSCPath == ${cscPath}`);

    // Add folder where CSC lives to the PATH
    await core.addPath(cscPath);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();


async function FindCSC(pathToVSWhere:string):Promise<string>{

  let cscPath = "";

  const options:ExecOptions = {};
  options.listeners = {
    stdout: (data: Buffer) => {
      const output = data.toString();
      cscPath += output;
    }
  };

  // Run VSWhere to tell us where CSC is
  const vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
  await exec.exec(vsWhereExe, ['-latest', '-requires', 'Microsoft.VisualStudio.Component.Roslyn.Compiler', '-find', 'MSBuild\\**\\CSC.exe'], options);

  if(cscPath === ""){
    core.setFailed("Unable to find CSC.exe");
  }

  const folderForCSC = path.dirname(cscPath);
  core.debug(`CSC = ${cscPath}`);
  core.debug(`Folder for CSC ${folderForCSC}`);

  return folderForCSC;
}