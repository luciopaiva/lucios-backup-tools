
# Lucio's backup tools

This is a toolkit I made to help me backup my old CDs and DVDs.

## How to install

The scripts need Node.js to run. Best is to use nvm to install the correct version needed by the tools. Refer to nvm home page for details on how to install it.

Once nvm is installed, run the following command at the root of this repo:

    nvm use

It will download and install the correct Node.js version locally.

Needless to say, you also need an AWS account. Considering you have one, generate an IAM access key with full S3 access and create a file at `$HOME/.aws/credentials` with it (or add it to your environment vars), otherwise scripts will fail.

## Tools

### upload-to-s3-with-md5.js

Given a local folder, uploads all relevant files (right now .iso files) to S3, also validating them after they're uploaded via the MD5 AWS HTTP header. If remote file doesn't match the hash, the script will tell you.

Make sure you have Internet access with decent upload speed, otherwise big files will take a huge amount of time.

### verify-md5.js

Given a local folder, this script checks all relevant files (.iso) to see if their hashes match their companion .md5 files. If there's a file named `some-file.iso`, the script will look for `some-file.md5` and see if its contents match the calculated MD5 hash for the file.

This task takes some time for big files (we're talking 100MB or greater) since the MD5 has to be calculated.
