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

const MAX_SINGLE_PART_UPLOAD_SIZE = 1_000_000_000;  // must be something less than 5GB

async function uploadFile(fileName) {
    let md5 = readMd5FileContents(config.path, fileName);

    const fullFilePath = path.join(config.path, fileName);

    console.info(chalk.green(fullFilePath));
    if (md5) {
        console.info("> MD5: " + md5);
        const fileSize = fs.statSync(fullFilePath).size;
        console.info(`> Size: ${(fileSize / 1024 / 1024).toFixed(0)}MB`);

        if (fileSize > MAX_SINGLE_PART_UPLOAD_SIZE) {
            console.info(`Switching to multipart upload due to big file size.`);
            await uploadMultipartFile(fileName, fullFilePath, fileSize);
        } else {
            await uploadSinglePartFile(fileName, fullFilePath, md5);
        }
    } else {
        console.info(chalk.red("SKIPPED - NO MD5 FILE FOUND"));
    }
    console.info("");
}

async function uploadMultipartFile(fileName, fullFilePath, fileSize) {
    // start multipart upload
    console.info(`Creating multipart upload for file "${fileName}"...`);
    let uploadId;
    try {
        uploadId = await S3.startMultipartUpload(config.bucket, fileName);
    } catch (e) {
        console.error(`Could not create multipart upload for file "${fileName}". Aborting.`);
        process.exit(1);
    }
    console.info(`Got upload id: ${uploadId}`);

    // split file into <5GB streams
    const parts = [];
    let success = true;
    let partNumber = 1;

    try {
        let start = 0;
        let end = Math.min(MAX_SINGLE_PART_UPLOAD_SIZE, fileSize);
        let remaining = fileSize;
        do {
            console.info(`Uploading part ${partNumber} (range ${start} to ${end} of ${fileSize} bytes)...`);

            console.info(`Calculating MD5 for part ${partNumber}...`);
            const md5 = await FileUtils.computeMd5(fullFilePath, start, end);
            console.info(`MD5: ${md5}`);

            const progress = new TtyProgress();
            const stream = fs.createReadStream(fullFilePath, { start: start, end: end-1 });
            const size = end - start;
            const response = await S3.uploadPart(config.bucket, fileName, stream, size, md5, uploadId, partNumber,
                awsProgress => progress.update(awsProgress.loaded, awsProgress.total));

            parts.push({
                ETag: response.ETag,
                PartNumber: partNumber,
            });
            console.info(`Part ${partNumber} done (Etag=${response.ETag}.`);

            partNumber++;
            remaining -= end - start;
            [start, end] = [end, end + Math.min(MAX_SINGLE_PART_UPLOAD_SIZE, remaining)];
        } while (remaining > 0);
    } catch (error) {
        console.error(`${error.code} - ${error.message}`);
        console.error(`Failed uploading part ${partNumber}.`);
        success = false;
    }

    // finish upload (handle errors and abort multipart upload if necessary)
    await S3.endMultipartUpload(config.bucket, fileName, uploadId, success ? parts : null);
    console.info(`Multipart ${success ? "completed" : "aborted"}.`);
}

async function uploadSinglePartFile(fileName, fullFilePath, md5) {
    const progress = new TtyProgress();
    const error = await S3.upload(config.bucket, fileName, fs.createReadStream(fullFilePath), md5,
            awsProgress => progress.update(awsProgress.loaded, awsProgress.total));
    if (!error) {
        console.info(`${fileName} ${chalk.green("UPLOADED, MD5 PASSED")}`);
    } else {
        console.info(`${fileName} ${chalk.red(`${error.code} - ${error.message}`)}`);
    }
}

/**
 * @return {void}
 */
async function main() {
    const alreadyUploaded = new Set();

    console.info(`Listing contents for bucket '${config.bucket}'...`);
    for await (const object of S3.listBucket(config.bucket)) {
        const key = object["Key"];
        alreadyUploaded.add(key);
    }

    console.info("Iterating local files...");
    for (const fileName of FileUtils.iterateFilesInDirectory(config.path, config.extensions)) {
        if (alreadyUploaded.has(fileName)) {
            console.info(chalk.gray(`Skipping "${fileName}": already uploaded`));
            console.info("");
        } else {
            await uploadFile(fileName);
        }
    }
}

main();
