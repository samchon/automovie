# src/material/sampleAutoMovieProceduralSurface.ts#sampleAutoMovieProceduralSurface

## @evidence contracts/development/common.md#meaningful-documentation

States both sampling spaces, the transform convention, the module offset, the interpolation, the determinism and every throw.

## @evidence contracts/development/implementation.md#principled-implementation

Maps a piece UV through the same `diag(scale) · R(−rotationDeg) · uv + offset` matrix three's `setUvTransform` builds, into sheet metres by the tile, so a face sheet is continuous across joints; then interpolates the pairs linearly by the pattern value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the sample point and the interpolation; the pattern, offset and frame are delegated to their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sample is cached or replayed; a mismatched form throws rather than guessing a space.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pattern evaluation per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
