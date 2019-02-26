
const
    chalk = require("chalk"),
    config = require("./config.json"),
    {readMd5FileContents} = require("./lib/md5"),
    FileUtils = require("./lib/file-utils");

/**
 * @return {void}
 */
async function main() {
    const md5ByFileName = new Map();

    // collect all files in original directory
    for (const fileName of FileUtils.iterateFilesInDirectory(config.path, config.extensions)) {
        const md5Expected = readMd5FileContents(config.path, fileName);
        md5ByFileName.set(fileName, md5Expected);
    }

    // compare with files in mirror directory
    for (const [fileName, md5Expected] of md5ByFileName) {
        console.info(fileName);

        const md5Mirror = readMd5FileContents(config.mirrorPath, fileName);
        if (!md5Mirror) {
            console.info(chalk.red("MD5 not found in mirror"));
        } else {
            const match = md5Expected === md5Mirror;
            if (!match) {
                console.info(chalk.red("MD5s do not match"));
            } else {
                console.info(chalk.green("MD5 matched"));
            }
        }
    }
}

main();
