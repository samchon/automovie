# src/capture/planAutoMovieVideoSceneCuts.ts#planAutoMovieVideoSceneCuts

## @evidence contracts/development/common.md#meaningful-documentation

States what is detected, the score's range and the default threshold, what the report holds, what else is written, how the path is escaped, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

FFmpeg's `scdet` filter documents the score range and `lavfi.scd.time` on a changed frame; `metadata=mode=select` keeps frames carrying that key and `metadata=mode=print:file=` prints all of their metadata; FFmpeg's filter-graph escaping section gives the two escaping levels applied to the path.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Escape the path, then one argument list; running it is the host's injected runner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The threshold is the caller's, with FFmpeg's default left to the grammar, and no shell is involved, so no shell quoting is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the path's length; FFmpeg decodes the file once without audio.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of three values.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and keeps nothing.
