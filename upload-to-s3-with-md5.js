/*
   This tool uploads files to S3 and asks AWS to verify its integrity via a MD5 hash.

   Create IAM role with full S3 access via the AWS management console, then put your credentials in $HOME/.aws/credentials file (see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html)

 */

const
    fs = require("fs"),
    path = require("path"),
    chalk = require("chalk"),
    config = require("./config.json"),
    {readMd5FileContents} = require("./lib/md5"),
    FileUtils = require("./lib/file-utils"),
    TtyProgress = require("./lib/tty-progress"),
    S3 = require("./lib/s3");

async function uploadFile(fileName, updateProgress) {
    let md5 = readMd5FileContents(config.path, fileName);

    const fullFilePath = path.join(config.path, fileName);

    console.info(chalk.green(fullFilePath));
    if (md5) {
        console.info("> MD5: " + md5);
        console.info(`> Size: ${(fs.statSync(fullFilePath).size / 1024 / 1024).toFixed(0)}MB`);
        const error = await await S3.upload(config.bucket, fileName, fs.createReadStream(fullFilePath), md5, updateProgress);
        if (!error) {
            console.info(`${fileName} ${chalk.green("UPLOADED, MD5 PASSED")}`);
        } else {
            console.info(`${fileName} ${chalk.red(`${error.code} - ${error.message}`)}`);
        }
    } else {
        console.info(chalk.red("SKIPPED - NO MD5 FILE FOUND"));
    }
    console.info("");
}

/**
 * @return {void}
 */
async function main() {
    const alreadyUploaded = new Set();
    for await (const object of S3.listBucket(config.bucket)) {
        const key = object["Key"];
        alreadyUploaded.add(key);
    }

    for (const fileName of FileUtils.iterateFilesInDirectory(config.path, config.extensions)) {
        const progress = new TtyProgress();
        if (alreadyUploaded.has(fileName)) {
            console.info(chalk.gray(`Skipping "${fileName}": already uploaded`));
            console.info("");
        } else {
            await uploadFile(fileName, awsProgress => progress.update(awsProgress.loaded, awsProgress.total));
        }
    }
}

main();
