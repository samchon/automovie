# src/capture/index.ts#planAutoMovieVideoFrames

## @evidence contracts/development/common.md#meaningful-documentation

States the expression's form, what passthrough keeps, how outputs are numbered and in what order, the pixel format, and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

FFmpeg's `select` filter evaluates its expression per frame with `n` the frame's index from zero and passes a frame when the expression is non-zero; `eq` and `between` are its documented functions and `+` adds their results, so the expression is non-zero exactly on the listed indices. The image2 muxer numbers outputs consecutively from `-start_number`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sort and deduplicate, group runs, write one argument list; running it is the host's injected runner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quoted expression keeps its commas inside one filter, and no shell is involved, so no shell quoting is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sort of the indices, then linear; runs keep the expression short for windows of consecutive frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and keeps nothing.
