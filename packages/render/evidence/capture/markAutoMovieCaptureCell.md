# src/capture/markAutoMovieCaptureCell.ts#markAutoMovieCaptureCell

## @evidence contracts/development/common.md#meaningful-documentation

States what the picture stands for, its two consumers and why it is kept on the sheet.

## @evidence contracts/development/implementation.md#principled-implementation

One opaque colour over the cell's own size, so the sheet copies it without reduction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fill.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The colour is a fixed marker chosen to differ from a drawn still's background, not a measured value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the cell's pixels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A cell-sized picture is cheap and each sheet copies it once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one cell-sized picture and keeps nothing.
