# src/material/autoMovieProceduralFrame.ts#autoMovieProceduralFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the three vectors, the fallback threshold, why Z decides the weft and that the renderer receives the same vectors.

## @evidence contracts/development/implementation.md#principled-implementation

Gram-Schmidt-free orthonormal frame by two cross products from a fixed reference axis; the fallback avoids the degenerate cross product when the axis is along Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the frame, so the CPU pattern and the shader uniforms cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-6 threshold only detects a parallel axis; any nonparallel axis yields the exact frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The renderer computes it once per material; the CPU pattern per sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
