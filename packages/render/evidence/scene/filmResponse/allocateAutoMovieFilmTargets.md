# src/scene/filmResponse/allocateAutoMovieFilmTargets.ts#allocateAutoMovieFilmTargets

## @evidence contracts/development/implementation.md#principled-implementation

Half-float targets keep the linear light's range; the linear target alone carries a depth texture for the overlays and the medium; pyramid levels halve with ceiling rounding as deep as the deepest glare kernel, and each kernel gets a row and a column target at its level.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved out of the stage so the stage stays under the file size rule; the stage is its only caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Levels and kernels come from `planAutoMovieFilmGlare`; nothing is sized for a case.

## @evidence contracts/development/common.md#meaningful-documentation

States every target made and that the caller owns and disposes them.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear target plus a pyramid and kernel targets whose total area is a fraction of the frame's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The stage reuses the result while the raster is unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new targets the stage owns and releases on a raster change or dispose.
