# src/inspector/assertAutoMovieInspectorRaster.ts#assertAutoMovieInspectorRaster

## @evidence contracts/development/common.md#meaningful-documentation

States the four checked fields, the refusal and why it comes before the playhead takes the duration.

## @evidence contracts/development/implementation.md#principled-implementation

A clock and a picture need a positive finite duration, frame rate and raster.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the four fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses rather than clamping a value the subject declared.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.