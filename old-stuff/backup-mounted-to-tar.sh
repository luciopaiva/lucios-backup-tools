#!/bin/bash
# Script to automate backup of CDROMs using tar
# by Lucio Paiva
# 2017-03-12
#
# This script was intended as a way to backup multi-session CDs, since dd and
# ddrescue aren't able to see more than the first session in a CD. dd and
# ddrescue simply read the first available session, creating an ISO file from
# it. All following sessions are simply lost!
#
# The solution was to use tar and read from the mount created by the operating
# system, which merges all CD sessions into a single file system. This
# guarantees that all files will be saved.
#
# tar stdout and stderr are saved to separate files. Any files that failed
# during copy will appear in the stderr log file. During tar execution, failed
# files will also appear in red on our console. A summary of failed files will
# also appear at the end of the script execution.

# CHECK VARIABLES BELOW BEFORE RUNNING THE SCRIPT!

# This variable must be configured prior to running this script. This is the
# base path where the mounted CDROM will be found.
CDROM_BASE_PATH="/media/lucio"

# This variable must be configured prior to running this script. This is the
# base path where tar files will be saved to.
BACKUP_BASE_PATH="/home/lucio/Desktop/backups"

# You shouldn't need to change anything below here.

if (( $# != 2 )); then
    echo 'Usage: backup-mounted-to-tar.sh <cdrom_name> <backup_filename>'
    echo '  <cdrom_name>: name of the mount. Will be prefixed with /media/<user>/'
    echo '  <backup_filename>: name of the file to be generated. Omit extension!'
    exit 0
fi

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 0
fi

CDROM="${CDROM_BASE_PATH}/${1}"
BACKUP_TAR="${BACKUP_BASE_PATH}/$2.tar"
LOG_FILE="${BACKUP_TAR}.log"
ERR_FILE="${BACKUP_TAR}.err"
MD5_FILE="${BACKUP_TAR}.md5"

rm "${LOG_FILE}" "${ERR_FILE}" "${BACKUP_TAR}" "${MD5_FILE}"
echo "Removed old files"

cd "${CDROM}"
if [[ $? -ne 0 ]]; then
    echo "Could not enter CDROM directory."
    exit 1
fi

echo "Starting tar..."
# tee redirection explanation: http://stackoverflow.com/a/692407/778272
# stderr in red: http://serverfault.com/a/502019
tar -cvf "${BACKUP_TAR}" * > >(tee "${LOG_FILE}") 2> >(tee "${ERR_FILE}" | sed $'s,.*,\e[31m&\e[m,' >&2)
echo "tar complete"

if [ ! -f "${BACKUP_TAR}" ]; then
    echo 'Error creating tar file'
    exit 1
fi

md5sum "${BACKUP_TAR}" > "${MD5_FILE}"
md5sum -c "${MD5_FILE}" || ( echo "MD5 check failed." && exit 1 )
echo "MD5 done"

if [ -s "${ERR_FILE}" ]; then
    echo ""
    echo "The following errors were reported by tar:"
    cat "${ERR_FILE}"
    echo ""
fi

echo "All done."
