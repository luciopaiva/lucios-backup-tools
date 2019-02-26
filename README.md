
# Lucio's backup tools

This is a toolkit I made to help me backup my old CDs and DVDs.

## How to install

### Node.js

The scripts need Node.js to run. Best is to use nvm to install the correct version needed by the tools. Refer to nvm home page for details on how to install it.

Once nvm is installed, run the following command at the root of this repo:

    nvm use

It will download and install the correct Node.js version locally.

### AWS access key

Needless to say, you also need an AWS account. Considering you have one, generate an IAM access key with full S3 access and create a file at `$HOME/.aws/credentials` with it (or add it to your environment vars), otherwise scripts will fail.

### config.json

Last, create a `config.json` file based on `config.json.template` and specify:

- bucket name in S3 where files will be saved
- directory with files to upload to S3
- list of extensions the script should care about when choosing which files to upload

## Tools

### upload-to-s3-with-md5.js

Given a local folder, uploads all relevant files (relevant extensions configurable via config.json) to S3, also validating them after they're uploaded via the MD5 AWS HTTP header. If remote file doesn't match the hash, the script will warn you.

The script first checks which files already exist in the bucket and skips them (it tells you in case it does).

### verify-md5.js

Given a local folder, this script checks all relevant files (.iso) to see if their hashes match their companion .md5 files. If there's a file named `some-file.iso`, the script will look for `some-file.md5` and see if its contents match the calculated MD5 hash for the file.

This task takes some time for big files (we're talking 100MB or greater) since the MD5 has to be calculated.

### verify-mirror.js

When saving backups of my CDs and DVDs and before actually uploading to the cloud I keep one extra copy of each ISO and TAR file in a separate hard disk as well, in case the first one eventually fails.

I was suspecting that I may have screwed up one of the copies, so I decided to write this script to verify that MD5 files in one disk match MD5 files on the other. `verify-md5.js` will do the job of verifying that MD5 files are matching the correct file hash and `verify-mirror.js` will make sure that MD5s across disks are also consistent.
