/*
   I wrote this script to help me understand if I can do a better job than tar when reading files within bad sectors.
 */

const
    assert = require("assert"),
    path = require("path"),
    util = require("util"),
    fs = require("fs"),
    moment = require("moment"),
    chalk = require("chalk"),
    config = require("./config.json");

const open = util.promisify(fs.open);
const read = util.promisify(fs.read);
const write = util.promisify(fs.write);

const
    CHUNK_LENGTH = 1024,
    OUTPUT_COLUMNS = 128;

function makeFillIn(fileName, totalLen) {
    const textExtensions = config.knownTextExtensions;
    let binaryFillIn = true;
    if (Array.isArray(textExtensions)) {
        if (textExtensions.some(extension => fileName.endsWith(extension))) {
            if (typeof config.badSectorTextFillIn === "string") {
                binaryFillIn = false;
                console.info("Detected text file. Using text fill-in for bad sectors.");
            }
        }
    }

    if (binaryFillIn) {
        console.info("Using BINARY fill-in for bad sectors.");
        return Buffer.alloc(totalLen);
    }

    const fillInLength = config.badSectorTextFillIn.length;
    assert(fillInLength > 0);
    const repeats = Math.floor(totalLen / fillInLength);
    const remainder = totalLen % fillInLength;
    let result = config.badSectorTextFillIn.repeat(repeats);
    if (remainder > 0) {
        result += config.badSectorTextFillIn.substr(0, remainder);
    }
    return Buffer.from(result, "utf-8");
}

/** @return {void} */
async function main(fileName) {
    if (!fileName) {
        console.error("Usage: node read-single-file <file-name>");
        process.exit(1);
    }

    assert(typeof config.workingDirectory === "string");
    assert(config.workingDirectory.length > 0);

    const chunkLen = CHUNK_LENGTH;

    const fillIn = makeFillIn(fileName, chunkLen);

    console.info(`Opening file "${fileName}" for read access...`);
    const fileStat = fs.statSync(fileName);
    console.info(`File size: ${fileStat.size} bytes`);
    const inputFd = await open(fileName, "r");
    const outputFileName = moment().format("YYYYMMDD-HHmmss") + "-" + fileName.replace(/[/]/g, "-");
    const outputFd = await open(path.join(config.workingDirectory, outputFileName), "w");
    const pos = 0;

    const summary = [
        "Lucio's backup tools single file recovery session",
        "Date: " + moment().format(),
        "Command: " + process.argv.join(" "),
        "Input file: " + fileName,
        "Input file size: " + fileStat.size,
        "Chunk size: " + chunkLen,
    ];
    let badChunksCount = 0;
    const chunks = [];
    const buffer = Buffer.alloc(chunkLen);

    for (let pos = 0, chunkIndex = 0; pos < fileStat.size; pos += chunkLen, chunkIndex++) {
        if (chunkIndex % OUTPUT_COLUMNS === 0) {
            process.stdout.write("\n");
        }

        const bytesExpected = Math.min(chunkLen, fileStat.size - pos);
        try {
            const {bytesRead} = await read(inputFd, buffer, 0, chunkLen, pos);
            if (bytesRead === bytesExpected) {
                process.stdout.write(chalk.green("◼"));
                chunks.push("_");
            } else {
                process.stdout.write(chalk.yellow("◼"));
                chunks.push("?");
            }

            const {bytesWritten} = await write(outputFd, buffer, 0, bytesRead, pos);
            assert(bytesWritten === bytesRead);

        } catch (e) {
            process.stdout.write(chalk.red("◼"));
            chunks.push("X");
            badChunksCount++;

            const {bytesWritten} = await write(outputFd, fillIn, 0, bytesExpected, pos);
            assert(bytesWritten === bytesExpected);
        }
    }

    summary.push(`Chunks: ${chunks.join("")}`);
    summary.push("Bad chunks: " + badChunksCount);
    const summaryStr = summary.join("\n");
    console.info("\n\n" + summaryStr);

    const summaryFileName = outputFileName + "-recovery-details.txt";
    fs.writeFileSync(path.join(config.workingDirectory, summaryFileName), summaryStr);
}

main(...process.argv.slice(2));
