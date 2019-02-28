#!/usr/bin/env python
#
# This program acts as an index for file stored in multiple tar and iso files. It scans these archives and index each
# and every file found, also calculating the MD5 of every file in the process.
#
# Usage:
#
# - to parse a new archive:
#   ./file-scavenger.py add <iso-or-tar-file>
#
# - to list files found in multiple archives:
#   ./file-scavenger.py duplicates
#
import sys
import tarfile
import os.path
import hashlib
import sqlite3


def prepare_database():
    conn = sqlite3.connect('files.db')
    conn.text_factory = str
    conn.execute('CREATE TABLE IF NOT EXISTS archive ('
                 'id integer PRIMARY KEY AUTOINCREMENT,'
                 'name text NOT NULL)')
    conn.execute('CREATE TABLE IF NOT EXISTS file ('
                 'id integer PRIMARY KEY AUTOINCREMENT,'
                 'path text NOT NULL,'
                 'name text NOT NULL,'
                 'extension text,'
                 'size int NOT NULL,'
                 'md5 text NOT NULL,'
                 'archive_id integer NOT NULL)')
    return conn


def persist_archive(archive_name, file_tuples):
    conn = prepare_database()
    c = conn.cursor()
    c.execute('INSERT INTO archive (name) VALUES (?)', (archive_name,))
    archive_id = c.lastrowid
    augmented_tuples = []
    for file_tuple in file_tuples:
        (path, filename, extension, size, md5) = file_tuple
        augmented_tuples.append((archive_id, path, filename, extension, size, md5))
    c.executemany('INSERT INTO file (archive_id, path, name, extension, size, md5) VALUES (?, ?, ?, ?, ?, ?)',
                  augmented_tuples)
    conn.commit()
    conn.close()


def calculate_md5(file):
    h = hashlib.new('md5')
    chunk_size = 1 << 16
    chunk = file.read(chunk_size)  # 64kB chunks
    while chunk:
        h.update(chunk)
        chunk = file.read(chunk_size)
    return h.hexdigest()


def add_archive(archive_name):
    file_tuples = []
    with tarfile.open(name=archive_name, mode='r') as tar:
        for entry in tar:
            if not entry.isfile():
                continue
            path, filename = os.path.split(entry.name)
            _, ext = os.path.splitext(filename)
            h = calculate_md5(tar.extractfile(entry))
            file_tuples.append((path, filename, ext, entry.size, h))
            # print('{} {} {} ({} bytes) {}'.format(path, filename, ext, entry.size, h))
        print('\nTotal files parsed: {}'.format(len(file_tuples)))
    persist_archive(archive_name, file_tuples)


def usage():
    print('./file-scavenger.py add <tar-file>')
    exit(0)


def main(args):
    if len(args) == 3 and args[1] == 'add':
        add_archive(args[2])
    else:
        usage()


if __name__ == "__main__":
    main(sys.argv)
