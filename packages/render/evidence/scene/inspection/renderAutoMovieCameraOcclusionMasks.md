# src/scene/inspection/renderAutoMovieCameraOcclusionMasks.ts#renderAutoMovieCameraOcclusionMasks

## @evidence contracts/development/common.md#meaningful-documentation

States the two passes, the region-sized framebuffer behind a full-raster viewport, and both outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

A viewport the size of the delivered raster, offset by the region's corner, rasterizes every scratch sample where the delivered frame does, and a scratch depth buffer of the canvas's precision reproduces its depth tests; a mismatch refuses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and the region stay with measureAutoMovieCameraOcclusionPixels; this function only renders and counts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original canvas is never scratch storage, and a composite pixel outside the isolated subject refuses rather than counting.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two renders of the scene into a region-sized target, one reused RGBA buffer, and a single pass when the subject is empty or nothing can cover it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each audit renders the current placement; no earlier raster is valid for it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed materials, layers, background and framebuffer are restored, and the owned target and mask materials disposed, on success and on error.
