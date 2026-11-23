# src/render/filmShading/autoMovieIrradianceGrid.ts#autoMovieIrradianceGrid

## @evidence contracts/development/common.md#meaningful-documentation

States the count rule, its rounding allowance, the order and units of the positions.

## @evidence contracts/development/implementation.md#principled-implementation

A regular grid from the box's lowest corner at the pitch; the 1e-9 allowance keeps a whole-multiple box from losing its far face to rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the grid the bake and the shader uniforms share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No box is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the probe count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond its result.
