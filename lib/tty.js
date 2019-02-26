
const
    out = process.stdout;

const CSI = '\x1B[';

function esc(param) {
    return CSI + param;
}

// see https://en.wikipedia.org/wiki/ANSI_escape_code
class Tty {

    static isEnabled() {
        return out.isTTY;
    }

    static clearLine() {
        out.write(esc("2K"));  // erase current line
        out.write("\r");       // move cursor to beginning of line
        return Tty;
    }

    static terminalWidth() {
        return out.columns;
    }
}

module.exports = Tty;
