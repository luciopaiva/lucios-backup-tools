
These files came from my old backup tools project and may still be worth using at some point, so I'm keeping them here.

What follows is the original README.

---

# Backup Tools

I had a lot of old backup CDs, some of them from 20 years ago. I want to get rid of the physical media and store all data in the cloud. For that, I needed some tools to automate all the reading from CDs, since I had dozens and dozens of them.


## My setup

In my current setup, I have an Ubuntu desktop with a regular CD player. I also have two hard drives reserved for the data to be backed up, besides the SSD I use to run the system itself. Each hard drive is meant to store a copy of each and every CD that gets backed up. This is to have redundancy in case data gets corrupted in one of them.

I'm currently using `ddrescue` for single-session CDs and my `backup-mounted-to-tar.sh` script for multi-session ones.

My plan is to make a simple tool to compute the MD5 hash of each and every file inside every tar and iso files and store them in a database (sqlite, probably) so that I can keep track of duplicate files across CDs, as there are probably lots of them. This database would also have information about which iso/tar holds the file, as well as its internal path. I can also extract the file extension to a separate column and then later be able to group by extension. And, why not, also store the creation timestamp and the size.

To generate the MD5 of each file, this guy made a Python script for it: https://www.guyrutenberg.com/2009/04/29/tarsum-02-a-read-only-version-of-tarsum/.

### Migrating from OSX

Initially, I was using a system running OSX to do the backups. Because of that, my two hard drives use the HFS+ file system. Although Linux is able to read/write to it, you may need to install this package first:

    sudo apt-get install hfsprogs

And then, in case Linux had already mounted the hard drives, you will need to unmount them and mount again, this time explicitly asking for write access (which is disabled by default). These were the exact commands I had to run:

    sudo mkdir /media/lucio/BACKUP
    sudo mount -t hfsplus -o force,rw /dev/sdc2 /media/lucio/BACKUP
    sudo mkdir /media/lucio/MIRROR
    sudo mount -t hfsplus -o force,rw /dev/sdd2 /media/lucio/MIRROR

*BACKUP* and *MIRROR* are the names of the HDs.


## Commands to create ISO files

The simplest command to generate an ISO file from a CD is:

    dd if=/dev/cdrom of=/path/to/iso

The con is that the `dd` that comes with Ubuntu 14.04 doesn't provide progress information. There are two possible solutions for that:

1. download and build a more recent version of `dd`: pretty easy to do. I just can't overwrite the one used by the system (people say it can cause issues), so just skip `make install` in the end. Get it from http://ftp.gnu.org/gnu/coreutils/coreutils-8.27.tar.xz and run

    tar xf coreutils-8.27.tar.xz
    cd coreutils-8.27
    ./configure
    make

And then just run it from the `src/` sub-directory.

2. use a program called `pv`:

    sudo apt-get install pv
    dd if=/dev/cdrom | pv | sudo dd of="/media/lucio/BACKUP/file.iso"


## CDs with reading issues

There is an alternative to `dd` in case the CD has reading issues which is `gddrescue`:

    sudo apt-get install gddrescue

Its basic usage is like this:

    sudo ddrescue -n -b2048 /dev/cdrom "file.iso" mapfile
    sudo ddrescue -d -r1 -b2048 /dev/cdrom "file.iso" mapfile

The first command starts the process. It reads without paying any attention to errors, simply skipping them and taking note of where they are. This info is stored in the file named `mapfile`. The second command then tries to patiently read those bad spots. It takes way more time to run than the first one. You may instruct it to retry more times by passing `-rn`, where `n` is the number of retries. Expect it to take hours to complete.

## Multi-session CDs

Some CDs are recorded with more than one session. Each session stores a separate ISO9660 file system. This means that, when you tell `dd` to generate an ISO image from a CD, it has to pick one session to do it. It just chooses the first one, ignoring all others. Because of that, one may unknowingly lose data by running `dd` or `ddrescue`, since they don't know about the other sessions.

Ubuntu (and all other operating systems), upon mounting a multi-session CD, simply merge all file systems found into a single directory structure, so it looks like there's a single in the CD where all things are stored.

### Check for multi-session CD

Install this program:

    sudo apt-get install cdrdao

Then make sure the CD-ROM is not mounted:

    sudo umount /dev/cdrom

And finally run:

    sudo cdrdao disk-info --device /dev/sr0

There's also an alternative program called `cd-info`:

    sudo apt-get install libcdio-utils
    cd-info

Finally, there's a third option, a GUI program called K3b which can be installed via Software Center.

## Mount a specific session

If you have a multi-session CD, you may mount a specific session by running:

    sudo mkdir -p /media/iso
    sudo mount /dev/cdrom /media/iso -t iso9660 -o session=0

Where `session=n` will mount session `n`. Sessions are numbered starting from 0.

## Backup multi-session CDs

There's no easy way to do it, specially if the CD has corrupted sectors.

This repo has a BASH script called `backup-mounted-to-tar.sh` to backup multi-session CDs using tar with MD5 checksum. It will invoke tar to copy all files from the merged mount provided by Ubuntu, so we can access all sessions at once. tar will also preserve timestamps. The script will generate MD5 checksums for every tar, so we can verify its integrity later.

In case the CD has read issues, tar will take note of every failed file in <filename>.tar.err, so you can later try and copy again each of those files.

## CDs with damaged file systems

In case the ISO9660 file system is damaged, you can try two other programs: testdisk and photorec. To install them:

    sudo apt-get install testdisk

P.S.: `photorec` comes with `testdisk`.

## Tools to inspect ISO images

You may inspect ISO images by using the cdrtools suite of programs.

    isoinfo -l -J -i 031\ -\ flash\ games.iso
    isoinfo -f -i /media/lucio/BACKUP/031\ -\ flash\ games.iso
    isoinfo -d -i /media/lucio/BACKUP/031\ -\ flash\ games.iso
    isoinfo -f -J -R -l -i /media/lucio/BACKUP/031\ -\ flash\ games.iso

See `man isoinfo` for other programs that may help.

To mount an ISO image:

    sudo mkdir /media/iso
    sudo mount -o loop /path/to/image.iso /media/iso

The destination `/media/iso` is just a suggestion and you may call it however you see fit.