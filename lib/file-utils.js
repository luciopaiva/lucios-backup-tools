
const
    crypto = require("crypto"),
    fs = require("fs");

class FileUtils {

    /**
     * Iterate through all files whose extension matches `extension` in given `path`.
     * `extension` is checked case-insensitively but returned file name is case-sensitive.
     *
     * Return format is a string with the full path to each file name found.
     *
     * @param {String} path
     * @param {String} extension
     * @return {IterableIterator<String>}
     */
    static *iterateFilesInDirectory(path, extension = "") {
        extension = extension.toLowerCase();
        for (const file of fs.readdirSync(path, { withFileTypes: true })) {
            if (file.isFile() && file.name.toLowerCase().endsWith(extension)) {
                yield file.name;
            }
        }
    }

    /**
     * Returns a string with the MD5 of the given file
     *
     * @param fullPath
     */
    static computeMd5(fullPath) {
        // based on https://stackoverflow.com/a/47951271/778272
        return new Promise((resolve, reject) => {
            fs.createReadStream(fullPath)
                .on("error", reject)
                .pipe(crypto.createHash("md5").setEncoding("hex"))
                .once("finish", function () { resolve(this.read()); });
        });
    }
}

module.exports = FileUtils;
