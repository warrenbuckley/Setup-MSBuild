import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { ExecOptions } from '@actions/exec/lib/interfaces';

async function run() {
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
    const directoryToAddToPath = await tc.find("vswhere", "2.7.1");

    if (directoryToAddToPath) {
      core.debug(`Found local cached tool at ${directoryToAddToPath} adding that to path`);

      const msBuildPath = await FindMSBuild(directoryToAddToPath);
      core.debug(`MSBuildPath == ${msBuildPath}`);

      // Add folder where MSBuild lives to the PATH
      await core.addPath(msBuildPath);
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

    const msBuildPath = await FindMSBuild(cachedToolDir);
    core.debug(`MSBuildPath == ${msBuildPath}`);

    // Add folder where MSBuild lives to the PATH
    await core.addPath(msBuildPath);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();


async function FindMSBuild(pathToVSWhere: string): Promise<string>{

  let msBuildPath = "";

  const options:ExecOptions = {};
  options.listeners = {
    stdout: (data: Buffer) => {
      let output = data.toString();
      msBuildPath += output;
    }
  };

  // Run VSWhere to tell us where MSBuild is
  let vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
  await exec.exec(vsWhereExe, ['-latest', '-requires', 'Microsoft.Component.MSBuild', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe'], options);

  if (msBuildPath === "") {
    core.setFailed("Unable to find MSBuild.exe");
  }

  const folderForMSBuild = path.dirname(msBuildPath)
  core.debug(`MSBuild = ${msBuildPath}`);
  core.debug(`Folder for MSBuild ${folderForMSBuild}`);

  return folderForMSBuild;
}
