/*
   Reads stderr dump file from tar to identify which files failed copy. Output sample:

    tar: Cracking/Crackin Tut/howtocrk.txt: Read error at byte 4096, while reading 10240 bytes: Input/output error
    tar: Drivers/USRobotics/56K-WinNT-V90/2974nt.exe: File shrank by 688775 bytes; padding with zeros
    tar: Midis/A-C.zip: File shrank by 348047 bytes; padding with zeros
    tar: Midis/O-S.zip: File shrank by 262578 bytes; padding with zeros
    tar: OpenNap/NapsterServer/opennap32.zip: File shrank by 182085 bytes; padding with zeros

  The script invokes tar asking specifically for those files that failed.

  Steps to run:

  1. set workingDirectory in config.json (where tar files will be generated)
  2. put CD in tray, mount it
  3. node retry-failed-files <path-to-tar-stderr-output-file> <path-to-cd>

  It will read the file listing from the stderr file and command tar to copy them from the CD, generating a new tar file
  in the working directory.

 */

const
    assert = require("assert"),
    path = require("path"),
    fs = require("fs"),
    moment = require("moment"),
    config = require("./config.json"),
    TarNavigator = require("./lib/tar-navigator");

/** @return {void} */
async function main(tarStdErrFile, pathToCd) {
    if (!tarStdErrFile || !pathToCd) {
        console.error("Usage: node retry-failed-files <tar-stderr-file> <path-to-cd>");
        process.exit(1);
    }

    const fileListing = [];

    const tarStderr = fs.readFileSync(tarStdErrFile, "utf-8");
    for (const line of tarStderr.split("\n")) {
        if (line.includes("tar: Exiting with failure status due to previous errors")) {
            continue;
        }

        const match = line.match(/tar:\s([^:]+)/);
        if (!match) {
            continue;
        }

        const fileName = match[1];

        fileListing.push(fileName);
    }

    try {
        process.chdir(pathToCd);
    } catch (e) {
        console.error(e);
        console.error("\nTried changing working directory to the CD/DVD path given, but it failed. Check that the CD/DVD is properly mounted.");
        process.exit(1);
    }

    console.info("List of files that will be attempted:");
    for (const fn of fileListing) {
        console.info("  - " + fn);
    }

    assert(typeof config.workingDirectory === "string");
    assert(config.workingDirectory.length > 0);

    const outputTarFileName = moment().format("YYYYMMDD-HHmmss[.tar]");
    const outputTarFullPath = path.join(config.workingDirectory, outputTarFileName);
    const output = await TarNavigator.createTarWithFiles(outputTarFullPath, ...fileListing);
    fs.writeFileSync(outputTarFileName + ".txt", output);
}

main(...process.argv.slice(2));
