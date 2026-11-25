# src/scene/inspection/measureAutoMovieCameraOcclusionPixels.ts#measureAutoMovieCameraOcclusionPixels

## @evidence contracts/development/implementation.md#principled-implementation

Source-owned semantic roots determine which actual drawable triangles belong to the subject. The audit preserves front-face opaque depth behavior and matches canvas depth precision in a private framebuffer. Overlapping projected bounds with ambiguous depth cannot certify parity after material replacement. The conservative projected box of every subject drawable, widened by two native samples and aligned to whole delivered pixels, bounds the subject's coverage.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, the region and the pass count stay here; renderAutoMovieCameraOcclusionMasks renders and counts, so each file owns one responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported drawables, materials, render state or depth order refuse with their reason instead of estimating; no budget turns a required audit into an open one.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal of the visible scene admits geometry before any raster allocation, and the raster is the subject's rectangle, not the frame. The disjoint-or-behind bounds certificate removes the composite pass when nothing can cover the subject.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each audit measures the current placement; no earlier raster is valid for it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Admission retains only the drawable list for the call; the mask renderer restores borrowed state and disposes its owned target and materials on success or error.

## @evidence contracts/development/common.md#meaningful-documentation

The metric is delivered pixel membership, with source identity, eligibility, the rendered rectangle, refusals and the absence of a budget explicit.
