
const
    fs = require("fs"),
    chalk = require("chalk"),
    moment = require("moment"),
    TarNavigator = require("./lib/tar-navigator"),
    FileUtils = require("./lib/file-utils");

/**
 * @param {String} basePath
 * @return {IterableIterator<FileTuple>}
 */
function iterateFiles(basePath) {
    const stat = fs.statSync(basePath);
    if (stat.isDirectory()) {
        return FileUtils.iterateAllFilesInDirectoryRecursive(basePath);
    }
    if (stat.isFile() && basePath.endsWith(".tar")) {
        return TarNavigator.iterateAllFiles(basePath);
    }
    throw new Error(`Unsupported file ${basePath} passed as argument.`);
}

/**
 * @return {void}
 */
async function main(args) {
    if (args.length !== 2) {
        console.error("Usage: node compare-directories <PATH_TO_FOLDER_OR_TAR_FILE> <ANOTHER_PATH_TO_FOLDER_OR_TAR_FILE>");
        process.exit(1);
        return;
    }

    const leftPath = args[0];
    const rightPath = args[1];

    /** @type {Map<String, FileTuple>} */
    const leftFileTuplesByName = new Map();
    for (const fileTuple of iterateFiles(leftPath)) {
        leftFileTuplesByName.set(fileTuple.name, fileTuple);
    }

    /** @type {Map<String, FileTuple>} */
    const rightFileTuplesByName = new Map();
    for (const fileTuple of iterateFiles(rightPath)) {
        rightFileTuplesByName.set(fileTuple.name, fileTuple);
    }

    const allFileNames = new Set();
    for (const fileName of leftFileTuplesByName.keys()) allFileNames.add(fileName);
    for (const fileName of rightFileTuplesByName.keys()) allFileNames.add(fileName);
    const sortedFileNames = [...allFileNames];
    sortedFileNames.sort();

    let anyDifferences = false;
    const onlyLeft = new Set();
    const onlyRight = new Set();
    const sizesDontMatch = new Map();
    const timesDontMatch = new Map();

    for (const fileName of allFileNames) {
        const leftFile = leftFileTuplesByName.get(fileName);
        const rightFile = rightFileTuplesByName.get(fileName);

        if (!leftFile) {
            onlyRight.add(fileName);
            anyDifferences = true;
            continue;
        }

        if (!rightFile) {
            onlyLeft.add(fileName);
            anyDifferences = true;
            continue;
        }

        if (leftFile.size !== rightFile.size) {
            sizesDontMatch.set(fileName, [leftFile.size, rightFile.size]);
            anyDifferences = true;
            continue;
        }

        const leftTime = moment(leftFile.atime).seconds(0).valueOf();
        const rightTime = moment(rightFile.atime).seconds(0).valueOf();
        if (leftTime !== rightTime) {
            timesDontMatch.set(fileName, [moment(leftTime).format(), moment(rightTime).format()]);
            anyDifferences = true;
        }
    }

    if (!anyDifferences) {
        console.info(chalk.green("Directories are identical!"));
    } else {
        if (onlyLeft.size > 0) {
            console.info(`Files only in "${leftPath}":`);
            for (const fileName of onlyLeft) {
                console.info(`  - ${fileName}`);
            }
        }
        if (onlyRight.size > 0) {
            console.info(`Files only in "${rightPath}":`);
            for (const fileName of onlyRight) {
                console.info(`  - ${fileName}`);
            }
        }
        if (sizesDontMatch.size > 0) {
            console.info("Sizes don't match:");
            for (const [fileName, [sizeLeft, sizeRight]] of sizesDontMatch) {
                console.info(`  - "${fileName}: ${sizeLeft}, ${sizeRight}`);
            }
        }
        if (timesDontMatch.size > 0) {
            console.info("Times don't match:");
            for (const [fileName, [timeLeft, timeRight]] of timesDontMatch) {
                console.info(`  - "${fileName}: ${timeLeft}, ${timeRight}`);
            }
        }

        console.info("Summary:");
        console.info("  - only left: " + onlyLeft.size);
        console.info("  - only right: " + onlyRight.size);
        console.info("  - conflicting sizes: " + sizesDontMatch.size);
        console.info("  - conflicting times: " + timesDontMatch.size);
    }
}

main(process.argv.slice(2));
