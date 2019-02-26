
const
    moment = require("moment"),
    chalk = require("chalk"),
    tty = require("./tty");

/**
 * Draws a progress bar on terminals that support ANSI escape codes (does nothing otherwise).
 *
 * Calculates effective speed in Mbps and also gives a very rudimentary ETA based on average speed since upload start.
 */
class TtyProgress {

    constructor () {
        this.startTime = 0;
    }

    update(loaded, total) {
        try {
            if (tty.isEnabled()) {
                if (this.startTime === 0) {
                    this.startTime = process.uptime();
                } else {
                    const width = tty.terminalWidth() - 6 - 1 - 1 - 9 - 1 - 4 - 5 - 1 - 2;
                    const columnsToFill = Math.floor(width * loaded / total);
                    const left = width - columnsToFill;
                    const percent = (100 * loaded / total).toFixed(1);
                    const percentStr = percent.padStart(5) + "%";  // total 6 digits

                    const elapsed = process.uptime() - this.startTime;

                    let speedStr = "-".padEnd(9);
                    let eta = "-".padEnd(5);

                    if (elapsed > 1) {
                        const speedInBps = loaded / elapsed;
                        const speedInMbps = speedInBps * 8 / (1 << 20);
                        speedStr = (speedInMbps.toFixed(1) + "Mbps").padEnd(9);  // total 9 digits

                        // ToDo consider only more recent speed measurements
                        const secondsLeft = (total - loaded) / speedInBps;

                        eta = moment().add(secondsLeft, "seconds").format("HH[h]mm");
                    }

                    tty.clearLine();
                    process.stdout.write(`${percentStr} @${speedStr} ETA:${eta} [${chalk.yellow("◼".repeat(columnsToFill)) + " ".repeat(left)}]`);
                }
            } else if (!this.printedNoTtyWarning) {
                console.info("(progress bar disabled because terminal does not support ANSI escape codes)");
                this.printedNoTtyWarning = true;
            }
        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = TtyProgress;
