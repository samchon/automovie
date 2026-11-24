# src/internal/admitRecoveryCameraPair.ts#admitRecoveryCameraPair

## @evidence contracts/development/implementation.md#principled-implementation

The caller's aggregate pixel budget is checked before any image-sized allocation, and each view's supplied pinhole chart is constructed once; analytic chart round trips test finite calibration representation rather than physical accuracy. The declared input owns its shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One recovery owner bounds the pair's pixels and delegates pinhole algebra to the chart owner; it neither detects features nor infers rigidity from bytes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No default camera, repaired image size, inferred lens or expected view identity is supplied, and the pixel budget is not silently increased.

## @evidence contracts/development/common.md#meaningful-documentation

States the preallocation pixel budget, the charts' one construction and the caller assertions it does not check.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two views require constant work; RGB bytes are neither scanned nor copied. The pixel budget precedes downstream traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared charts transfer once to feature consensus, optimization and triangulation; no later phase needs to invert the supplied calibrations again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function returns two owned fixed-size charts and a pixel count, retaining no RGB array, callback, handle or global cache on success or refusal.