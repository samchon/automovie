# src/scene/inspection/formatAutoMovieInspectionCameraView.ts#formatAutoMovieInspectionCameraView

## @evidence contracts/development/common.md#meaningful-documentation

States the text produced, why the record keeps it, when the up is written, and what of the camera a repeat reproduces.

## @evidence contracts/development/implementation.md#principled-implementation `lookAt` with an up direction keeps the up's component across the line of sight, so the up `+Y` gives is `Y` minus its projection on the line of sight, normalised; when that equals the recorded up the default reproduces the roll, and when the line of sight is vertical it is undefined and the recorded up must be written.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the fixed view from the record, then the shared view writer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance only decides whether a written default would reproduce the record; it never rounds a written number.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh string and keeps nothing.
