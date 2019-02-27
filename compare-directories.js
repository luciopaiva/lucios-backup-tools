
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

    for (const fileName of allFileNames) {
        const leftFile = leftFileTuplesByName.get(fileName);
        const rightFile = rightFileTuplesByName.get(fileName);

        if (!leftFile || !rightFile) {
            console.info(`"${fileName}": ${!leftFile && "NOT"} FOUND ${!rightFile && "NOT"} FOUND`);
            anyDifferences = true;
            continue;
        }

        if (leftFile.size !== rightFile.size) {
            console.info(`"${fileName}" sizes: ${leftFile.size} ${rightFile.size}`);
            anyDifferences = true;
            continue;
        }

        const leftTime = moment(leftFile.atime).seconds(0).valueOf();
        const rightTime = moment(rightFile.atime).seconds(0).valueOf();
        if (leftTime !== rightTime) {
            console.info(`"${fileName}" atime: ${moment(leftTime).format()} ${moment(rightTime).format()}`);
            anyDifferences = true;
        }
    }

    if (!anyDifferences) {
        console.info(chalk.green("Directories are identical!"));
    }
}

main(process.argv.slice(2));
