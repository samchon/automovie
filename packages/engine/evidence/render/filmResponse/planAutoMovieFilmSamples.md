# src/render/filmResponse/planAutoMovieFilmSamples.ts#planAutoMovieFilmSamples

## @evidence contracts/development/implementation.md#principled-implementation

Stratified midpoints of the trailing shutter interval give each sample an equal share of the open time; a Hammersley set mapped by Shirley and Chiu's concentric map spreads the eyes evenly over the aperture disk; and an affine permutation `(a k + ⌊N/2⌋) mod N` with `a` coprime to `N` near the golden-ratio fraction decorrelates time from lens position as Cook, Porter and Carpenter's distributed ray tracing requires. The aperture is the full-frame equivalent focal length of the field of view over the f-number. The trailing interval keeps the last placement at the frame's own second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure engine plan, kept apart from render's drawing loop so the timing and geometry are testable without a GPU.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The golden-ratio multiplier is a stated choice of a decorrelating stride, not tuned to a result; every other constant is the gate height or the cited maps.

## @evidence contracts/development/common.md#meaningful-documentation

States the time formula, the lens point construction, the permutation and why, the aperture formula and the determinism premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N log N) for N samples: each radical inverse takes log N steps; the coprime search is bounded by N.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One frame per call; plans are cheap beside the draws they schedule.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns N records and retains nothing.
