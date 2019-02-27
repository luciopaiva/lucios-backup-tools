
class FileTuple {

    constructor (name, size, atime) {
        this.name = name;
        this.size = size;
        this.atime = atime;
    }

    toString() {
        return `${this.name} (${this.size}  bytes, access time ${this.atime})`;
    }
}

module.exports = FileTuple;
