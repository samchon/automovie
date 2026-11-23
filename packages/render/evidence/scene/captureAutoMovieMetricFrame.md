# src/index.ts#captureAutoMovieMetricFrame

## @evidence contracts/development/implementation.md#principled-implementation

One original native render uses the supplied camera and current scene geometry; physical pixel dimensions and an explicit optional silhouette material define the capture without changing any model coefficients or camera matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This viewer operation owns temporary capture state and PNG extraction, reusing the framebuffer snapshot owner for target/cube-face/mip and logical/effective raster restoration, while the caller retains renderer, scene, camera and loaded subject ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No capture-only model, source image overlay, extra reconstruction, software renderer, native method replacement or silent resolution downgrade supplies pixels.

## @evidence contracts/development/common.md#meaningful-documentation

States physical pixel sizing, borrowed resources, surface versus structural silhouette meaning, restored states and caller redraw responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

One render and PNG encoding scale with admitted W times H pixels and visible scene geometry; maxPixels bounds output raster allocation before resizing and no persistent render target is retained.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each capture observes current mutable scene/camera state and has a distinct pixel effect, so it is not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed dimensions, pixel ratio, framebuffer/raster, background and override material are restored independently after success or failure; the one optional owned mask material is disposed and only PNG data transfers. Public disposal does not certify GPU-driver retirement.
