#!/bin/bash
# Script to automate backup of damaged, single-session CDROMs using ddrescue
# by Lucio Paiva
# 2017-03-12
#

# This variable must be configured prior to running this script. This is the
# base path where tar files will be saved to.
BACKUP_BASE_PATH="/media/lucio/BACKUP"

if (( $# != 1 )); then
    echo "Usage: backup-single-session-damaged.sh <iso-name>"
    echo "  <iso_name>: name of the final iso (without the extension)"
    exit 0
fi

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 0
fi

FILE_NAME="${1}"
FULL_ISO_NAME="${BACKUP_BASE_PATH}/${FILE_NAME} - ddrescue.iso"
FULL_MAP_NAME="${BACKUP_BASE_PATH}/${FILE_NAME}.mapfile"

if [ -f $FULL_MAP_NAME ]; then
    echo "Map file found. Restarting recovery process..."
    ddrescue -d -r6 -b2048 /dev/cdrom "${FULL_ISO_NAME}" "${FULL_MAP_NAME}"
else
    echo "This is the first run for this CD. Starting now..."
    ddrescue -n -b2048 /dev/cdrom "${FULL_ISO_NAME}" "${FULL_MAP_NAME}"
fi
