
const
    path = require("path"),
    fs = require("fs");

/**
 * Given a file `relativeFileName`, locates its companion `.md5` file and returns its contents, considering the file can
 * be found. Returns null otherwise.
 *
 * The contents can be of two possible forms:
 *
 *     54277e15c861e092d6e7c2afeced3039  filename.extension
 *     MD5 (filename.extension) = 54277e15c861e092d6e7c2afeced3039
 *
 * The function will extract just the hex part and get rid of the rest.
 *
 * @param {String} basePath
 * @param {String} fileName
 * @return {String}
 */
function readMd5FileContents(basePath, fileName) {
    let md5FileName;
    let fullMd5Name;
    let line;

    // first try appending `.md5` extension to the end of the file name and see if there's such file
    md5FileName = fileName + ".md5";
    fullMd5Name = path.join(basePath, md5FileName);
    try {
        line = fs.readFileSync(fullMd5Name, "utf-8").split("\n")[0];
    } catch (e) {
    }

    if (!line) {
        // if got here, try *replacing* file extension with `.md5` instead
        md5FileName = fileName.replace(/\.[^.]+$/i, ".md5");
        fullMd5Name = path.join(basePath, md5FileName);
        try {
            line = fs.readFileSync(fullMd5Name, "utf-8").split("\n")[0];
        } catch (e) {
        }
    }

    if (!line) {
        // still didn't find it - give up
        return null;
    }

    // try to match first pattern
    let match = line.match(/MD5\s*\(.*?\)\s*=\s*(\S+)/);
    if (match) {
        return match[1];
    }

    // try second pattern then
    match = line.match(/\s*(\S+)/);
    if (match) {
        return match[1];
    }

    // unknown pattern!
    throw new Error("Unknown pattern found: " + line);
}

module.exports = {
    readMd5FileContents,
};
