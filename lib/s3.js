
const
    aws = require("aws-sdk");

const s3 = new aws.S3();

class S3 {

    /**
     * Uploads a file to S3.
     *
     * Returns null if successful or an error object otherwise.
     *
     * @param {String} bucket the name of the bucket
     * @param {String} key the key inside the bucket
     * @param {Buffer|ReadStream} body the contents
     * @param {String} [md5] the expected md5 in hex format (optional)
     * @param {Function} progressCallback a function to be called whenever there's an update to the upload status
     * @return {Promise<AWSError>}
     */
    static async upload(bucket, key, body, md5, progressCallback) {
        return new Promise(resolve => {
            s3.putObject({
                Bucket: bucket,
                Key: key,
                Body: body,
                // add MD5 check if a hash was provided
                ...(md5 && { ContentMD5: Buffer.from(md5, "hex").toString("base64") }),
            }, resolve)
                .on("httpUploadProgress", progressCallback);
        });
    }

    static async startMultipartUpload(bucket, key) {
        return new Promise((resolve, reject) => {
            s3.createMultipartUpload({
                Bucket: bucket,
                Key: key
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else if (!data || !data["UploadId"]) {
                    data && console.error(data);
                    reject("Missing upload id!");
                } else {
                    resolve(data["UploadId"]);
                }
            });
        });
    }

    static async uploadPart(bucket, key, body, bodySize, md5, uploadId, partNumber, progressCallback) {
        return new Promise((resolve, reject) => {
            s3.uploadPart({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentLength: bodySize,
                // add MD5 check if a hash was provided
                ...(md5 && { ContentMD5: Buffer.from(md5, "hex").toString("base64") }),
                UploadId: uploadId,
                PartNumber: partNumber,
            }, (error, data) => error ? reject(error) : resolve(data))
                .on("httpUploadProgress", progressCallback);
        });
    }

    static async endMultipartUpload(bucket, key, uploadId, parts) {
        return new Promise((resolve, reject) => {
            if (Array.isArray(parts) && parts.length > 0) {
                s3.completeMultipartUpload({
                    Bucket: bucket,
                    Key: key,
                    UploadId: uploadId,
                    MultipartUpload: {
                        Parts: parts,
                    }
                }, (error, data) => {
                    error ? reject(error) : resolve(data);
                });
            } else {
                s3.abortMultipartUpload({
                    Bucket: bucket,
                    Key: key,
                    UploadId: uploadId,
                }, (error, data) => {
                    error ? reject(error) : resolve(data);
                });
            }
        });
    }

    /**
     * Lists a bucket's contents.
     *
     * @param {String} bucket the name of the bucket
     * @return {Promise<S3.Types.ListObjectsV2Output>}
     */
    static async *listBucket(bucket) {
        const request = new Promise((resolve, reject) =>
            s3.listObjectsV2({ Bucket: bucket }, (error, data) => error ? reject(error) : resolve(data)));

        const response = await request;

        for (const key of response.Contents) {
            yield key;
        }
    }
}

module.exports = S3;
