/*
   This tool uploads a file to S3 and asks AWS to verify its integrity via a MD5 hash.

   Create IAM role with full S3 access via the AWS management console, then put your credentials in $HOME/.aws/credentials file (see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html)

 */

const
    fs = require("fs"),
    path = require("path"),
    chalk = require("chalk"),
    config = require("./config.json"),
    FileUtils = require("./lib/file-utils"),
    S3 = require("./lib/s3");

function readMd5FileContents(relativePath) {
    const fullMd5Name = path.join(config.path, relativePath);
    try {
        return fs.readFileSync(fullMd5Name, "utf-8").split("\n")[0];
    } catch (e) {
        return null;
    }
}

async function uploadFile(fileName, appendMd5Extension = false) {
    const md5FileName = appendMd5Extension ? fileName + ".md5" : fileName.replace(/\.[^.]+$/i, ".md5");
    let md5 = readMd5FileContents(md5FileName);

    const fullFilePath = path.join(config.path, fileName);

    console.info(chalk.green(fullFilePath));
    if (md5) {
        md5 = md5.match(/=\s(\S+)/)[1];  // extract MD5 from BSD-style format
        console.info("> MD5: " + md5);
        const error = await await S3.upload(config.bucket, fileName, fs.createReadStream(fullFilePath), md5);
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

    for (const fileName of FileUtils.iterateFilesInDirectory(config.path, ".iso")) {
        if (alreadyUploaded.has(fileName)) {
            console.info(chalk.gray(`Skipping "${fileName}": already uploaded`));
            console.info("");
        } else {
            await uploadFile(fileName);
        }
    }
}

main();
