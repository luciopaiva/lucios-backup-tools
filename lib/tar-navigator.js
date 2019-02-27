
const
    execSync = require("child_process").execSync,
    moment = require("moment"),
    FileTuple = require("./file-tuple");

class TarNavigator {

    /**
     * @param tarFileName
     * @return {IterableIterator<FileTuple>}
     */
    static *iterateAllFiles(tarFileName) {
        const output = execSync(`tar -tvf ${tarFileName}`, { encoding: "utf-8" });
        for (const line of output.split("\n")) {
            /*
               Each line follows the format:

               -r-------- user/user 1958978 1993-10-05 08:44 path/to/some/file.ext
             */

            if (line.length === 0 || line.startsWith("d")) {
                continue;  // skip empty lines and directories
            }

            const match = line.match(/([-drwx]{10})\s*(\S+)\s*(\d+)\s*(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2})\s*(.*)/);

            if (!match) {
                throw new Error(`Malformed tar line "${line}"`);
            }

            const [, permissions, user, size, date, filePath] = match;

            yield new FileTuple(filePath, parseInt(size), moment(date).valueOf());
        }
    }
}

module.exports = TarNavigator;
