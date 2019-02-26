
const
    aws = require("aws-sdk");

const s3 = new aws.S3();

class S3 {

    /**
     * Uploads a file to S3.
     *
     * Returns null if successful or an error object otherwise.
     *
     * @param bucket the name of the bucket
     * @param key the key inside the bucket
     * @param body the contents
     * @param [md5] the expected md5 in hex format (optional)
     * @return {Promise<AWSError>}
     */
    static upload(bucket, key, body, md5) {
        return new Promise(resolve => {
            s3.putObject({
                Bucket: bucket,
                Key: key,
                Body: body,
                // add MD5 check if a hash was provided
                ...(md5 && { ContentMD5: Buffer.from(md5, "hex").toString("base64") }),
            }, resolve);
        });
    }
}

module.exports = S3;
