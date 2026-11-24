# src/readAutoMovieReviewOptions.ts#readAutoMovieReviewOptions

## @evidence contracts/development/common.md#meaningful-documentation

Describes the Inspector and file forms, seconds, explicit rebind, optional named decision, and how to scope an output folder.

## @evidence contracts/development/implementation.md#principled-implementation

Separates recording the local Inspector for wall-clock seconds from a point or interval in the published film's clock. A file rebind names the new file and time, while a replay reads the old receipt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admits known option names and delegates to one of two mode readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses mixing the modes, guessing a new position for a rebind, and treating an unnamed flag as a scoped decision. A still review selects one frame with `--at`. Playback and listening select intervals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over option names and bounded work to admit the selected mode.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the complete options once per command and returns a fresh selection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Acquires no external resources and retains no command state.
