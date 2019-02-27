
const
    path = require("path"),
    crypto = require("crypto"),
    fs = require("fs"),
    FileTuple = require("./file-tuple");

class FileUtils {

    /**
     * Iterate through all files whose extension matches `extension` in given `path`.
     * `extension` is checked case-insensitively but returned file name is case-sensitive.
     *
     * Return format is a string with the full path to each file name found.
     *
     * @param {String} basePath
     * @param {String[]} extensions
     * @return {IterableIterator<String>}
     */
    static *iterateFilesInDirectory(basePath, extensions = []) {
        extensions = extensions.map(extension => extension.toLowerCase());
        for (const file of fs.readdirSync(basePath, { withFileTypes: true })) {
            if (file.isFile()) {
                if (extensions.length === 0) {
                    yield file.name;
                } else {
                    const lower = file.name.toLowerCase();
                    if (extensions.some(extension => lower.endsWith(extension))) {
                        yield file.name;
                    }
                }
            }
        }
    }

    /**
     * Iteratively recurses through all directories in given basePath returning all files found with their full path.
     *
     * @param {String} basePath
     * @param {String} [originalBasePath]
     * @return {IterableIterator<FileTuple>}
     */
    static *iterateAllFilesInDirectoryRecursive(basePath, originalBasePath) {
        for (const file of fs.readdirSync(basePath, { withFileTypes: true })) {
            if (file.isFile()) {
                const fullPath = path.join(basePath, file.name);
                const stat = fs.statSync(fullPath);
                const relativePath = originalBasePath ? fullPath.slice(originalBasePath.length + 1) : fullPath;  // +1 removes leading slash
                yield new FileTuple(relativePath, stat.size, stat.atimeMs);
            } else if (file.isDirectory()) {
                yield *FileUtils.iterateAllFilesInDirectoryRecursive(path.join(basePath, file.name), originalBasePath || basePath);
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
