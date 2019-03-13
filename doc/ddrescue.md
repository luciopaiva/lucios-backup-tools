
# ddrescue notes

This article has random notes about ddrescue that I wrote while I was learning to use it.

## Use the correct program

First, be aware that there exists two programs called ddrescue, but the one we're interested in is actually **g**ddrescue (with a leading "g") and it can be installed by running:

    sudo apt-get install gddrescue

Note, however, that the installed binary will be called `ddrescue`, without the leading `g`.  

## What does it do?

ddrescue is able to rescue *single-session* media (it only sees the first session of multi-session ones) by reading raw sectors. It's a different approach to recovering by just trying to read each file using high-level OS functions (e.g., trying to recover with `tar`).

## Map files

ddrescue takes note of blocks traversed, marking them as finished if successfully read. For failing blocks, it can retry if commanded to. It keeps a so called "map file" which keeps status of what happened in previous read attempts, so you can invoke ddrescue again and continue from where it stopped.

## No easy way to map bad sectors to files

The drawback of using ddrescue is that bad sectors not necessarily point to important files and there's no easy way to know which files reside in bad sectors. The documentation provides a way to do it, but it will certainly take a large amount of time. See [ddrescue's manual](https://www.gnu.org/software/ddrescue/manual/ddrescue_manual.html), chapter *Fill mode* - at the end of the chapter there's a recipe to use fill mode to be able to identify files in bad sectors.
