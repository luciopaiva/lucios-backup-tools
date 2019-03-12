/*
   Analyzes the outcome of a tar command to copy files from some CD or DVD media.

   Its main purpose is to help get a feeling of how bad the medium is damaged and which files were rescued and which
   were lost due to bad sectors.
 */

const
    assert = require("assert"),
    fs = require("fs"),
    chalk = require("chalk");


class File {
    constructor (name) {
        this.name = name;
    }
}

function drawTree(root, failedFiles, shouldListGoodFiles, indent = "", fullPath = "") {
    for (const file of root.keys()) {
        if (root.get(file) instanceof File) {
            const filePath = fullPath + file;
            if (failedFiles.has(filePath)) {
                console.info(chalk.red(indent + file));
            } else if (shouldListGoodFiles) {
                console.info(chalk.green(indent + file));
            }
        } else {
            console.info(indent + file);
            drawTree(root.get(file), failedFiles, shouldListGoodFiles, indent + "  ", fullPath + file + "/");
        }
    }
}

/**
 * @param {Set<String>} fileNames
 * @param {Set<String>} failedFileNames
 */
function makeFileTree(fileNames, failedFileNames, shouldListGoodFiles) {
    const tree = new Map();
    for (const fileName of fileNames) {
        if (fileName.endsWith("/")) {  // this is a directory, but we're looking for file names
            continue;
        }

        const path = fileName.split("/");

        let base = tree;
        for (let i = 0; i < path.length; i++) {
            const name = path[i];

            if (i + 1 === path.length) {
                // it's a file
                base.set(name, new File(name));
            } else {
                if (!base.has(name)) {
                    base.set(name, new Map());
                }

                base = base.get(name);  // enter folder
            }
        }
    }

    drawTree(tree, failedFileNames, shouldListGoodFiles);
}

/** @return {void} */
async function main(outFileName, errFileName, shouldListGoodFiles = "true") {
    if (!outFileName || !errFileName) {
        console.error("Usage: node tar-outcome-treeview <stdout-dump-file> <stderr-dump-file>");
        process.exit(1);
    }

    shouldListGoodFiles = shouldListGoodFiles === "true";

    const fullFileListing = new Set();
    const failedFiles = new Set();

    // read the whole list of files processed by tar (stdout)
    const outFile = fs.readFileSync(outFileName, "utf-8");
    for (const fileName of outFile.split("\n")) {
        if (fileName.length > 0) {
            fullFileListing.add(fileName);
        }
    }

    // read list of files that failed (stderr)
    const errFile = fs.readFileSync(errFileName, "utf-8");
    for (const line of errFile.split("\n")) {
        if (line.includes("tar: Exiting with failure status due to previous errors")) {
            continue;
        }

        const match = line.match(/tar:\s([^:]+)/);
        if (!match) {
            continue;
        }

        const fileName = match[1];

        failedFiles.add(fileName);
    }

    // sanity check: all failed files must appear in the full listing
    for (const failedFileName of fullFileListing) {
        if (!fullFileListing.has(failedFileName)) {
            assert.fail(`Failed file "${failedFileName}" does not appear in the full listing.`);
        }
    }

    makeFileTree(fullFileListing, failedFiles, shouldListGoodFiles);

    console.info();
    console.info(`Total file count: ${fullFileListing.size}`);
    console.info(`Failed file count: ${failedFiles.size} (${(100 * failedFiles.size / fullFileListing.size).toFixed(1)}%)`);
}

main(...process.argv.slice(2));
