# src/listAutoMovieReleaseFindings.ts#listAutoMovieReleaseFindings

## @evidence contracts/development/common.md#meaningful-documentation

States the cursors selected and the skipped detectors.

## @evidence contracts/development/implementation.md#principled-implementation

Moved out of renderAutoMovieVideo unchanged, with a detector skip for the transparent layer, whose transparent frames read as black to the black detector.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function shared by both render modes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the named detector is skipped; scene findings, frozen intervals and stream findings still block.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in findings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
