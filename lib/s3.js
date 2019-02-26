
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
