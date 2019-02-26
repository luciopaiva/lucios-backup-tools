
const
    path = require("path"),
    fs = require("fs");

/**
 * Given a file `relativeFileName`, locates its companion `.md5` file and returns its contents, considering the file can
 * be found. Returns null otherwise.
 *
 * @param config
 * @param {String} relativeFileName
 * @return {String}
 */
function readMd5FileContents(config, relativeFileName) {
    let md5FileName;
    let fullMd5Name;

    // first try appending `.md5` extension to the end of the file name and see if there's such file
    md5FileName = relativeFileName + ".md5";
    fullMd5Name = path.join(config.path, md5FileName);
    try {
        return fs.readFileSync(fullMd5Name, "utf-8").split("\n")[0];
    } catch (e) {
    }

    // if got here, try *replacing* file extension with `.md5` instead
    md5FileName = relativeFileName.replace(/\.[^.]+$/i, ".md5");
    fullMd5Name = path.join(config.path, md5FileName);
    try {
        return fs.readFileSync(fullMd5Name, "utf-8").split("\n")[0];
    } catch (e) {
    }

    // still didn't find it - give up
    return null;
}

module.exports = {
    readMd5FileContents,
};
