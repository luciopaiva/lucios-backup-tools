/*
   This script verifies the integrity of all files in a given folder.

   For each file `some-file.iso` to verify, the script expects to find `some-file.md5` in the same folder. It will calculate the MD5 hash for the file and then compare it with the contents of the MD5 file, which should be in the form:

   MD5 (some-file.iso) = 6b1d72f23432a0ba1d158d628274bde6
 */

const
    path = require("path"),
    chalk = require("chalk"),
    config = require("./config.json"),
    {readMd5FileContents} = require("./lib/md5"),
    FileUtils = require("./lib/file-utils");

/**
 * @return {void}
 */
async function main() {
    for (const fileName of FileUtils.iterateFilesInDirectory(config.path, config.extensions)) {
        const md5Expected = readMd5FileContents(config.path, fileName);

        const fullIsoName = path.join(config.path, fileName);

        console.info(chalk.green(fullIsoName));
        if (md5Expected) {
            const md5Computed = await FileUtils.computeMd5(fullIsoName);

            if (config.verbose) {
                console.info(`MD5 expected: ${chalk.yellow(md5Expected)}`);
                console.info(`MD5 computed: ${chalk.yellow(md5Computed)}`);
            }

            const success = md5Expected === md5Computed;
            console.info(success ? chalk.green("PASSED") : chalk.red("FAILED"));
        } else {
            console.info(chalk.yellow("NO MD5 FILE FOUND"));
        }
        console.info("");
    }
}

main();
