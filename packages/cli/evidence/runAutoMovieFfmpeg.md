# src/runAutoMovieFfmpeg.ts#runAutoMovieFfmpeg

## @evidence contracts/development/common.md#meaningful-documentation

States what is resolved, the acceptance rule and its default, and what a rejection names.

## @evidence contracts/development/implementation.md#principled-implementation `child_process.spawn` without a shell passes each argument as it is, so a path with spaces or quotes needs no escaping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Spawn, collect the error output, settle on exit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed run is never retried, and a failure to start rejects with its cause.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the log FFmpeg writes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each run is its own process.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The child process ends before the promise settles; its log is held until then.
