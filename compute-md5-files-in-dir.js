/*
    Simple script to generate md5 checksum files for each file found in working directory.
 */

const
    execSync = require("child_process").execSync,
    FileUtils = require("./lib/file-utils"),
    config = require("./config");

process.chdir(config.workingDirectory);

for (const fileName of FileUtils.iterateFilesInDirectory(config.workingDirectory, config.extensions)) {
    const fileNameNoExt = fileName.replace(/\.[^.]+$/, "");
    execSync(`md5sum "${fileName}" > "${fileNameNoExt}.md5"`);
    console.info(`${fileName} done`);
}
