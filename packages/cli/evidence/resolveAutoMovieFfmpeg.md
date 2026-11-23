# src/index.ts#resolveAutoMovieFfmpeg

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the two sources and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation `ffmpeg-static` exports the path of the binary it downloaded, or null on a platform it has none for; the environment variable wins so a machine's own build can be used.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the variable, else load the package, else refuse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No `ffmpeg` on the search path is guessed, because a capture records the binary it ran.

## @evidence contracts/development/implementation.md#efficient-algorithms

One module load at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolved once per capture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a path and keeps nothing.
