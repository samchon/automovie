# src/capture/runAutoMovieCapture.ts#runAutoMovieCapture

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn and in what order, how labels are scaled and why, what happens to a failed cell, the file names, the order of file steps, and what a failure leaves.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md`: a cell that could not be drawn stays on the sheet with its cause, and the record keeps what repeats each observation. Pixels and files come only through the injected draw function and the folder's injected storage, so the order of file steps runs under a unit test.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Claim, then one loop that draws, stamps, writes and lays each cell, then the last sheet, the reduced diagnostics, the comparison that diffs them and the record; folder rules are the folder's and comparison rules the comparison's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed draw is recorded, never retried or replaced by a blank still, and a picture at the wrong raster is a failure rather than resized.

## @evidence contracts/development/implementation.md#efficient-algorithms

One encoding and one image reduction per still, one encoding per sheet. The still's written bytes and RGB identity are hashed separately from their existing buffers. Only diagnostic packets are sorted before grouping their findings and coverage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each cell is drawn once; nothing is shared between runs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One drawn still and the sheet being filled are held at a time, plus one row and any diagnostics per cell until the audit is reduced.
