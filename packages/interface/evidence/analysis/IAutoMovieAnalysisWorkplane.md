# src/analysis/IAutoMovieAnalysisWorkplane.ts#IAutoMovieAnalysisWorkplane

## @evidence contracts/development/design.md#principled-representation

A parametric grid `origin + u * axisU + v * axisV` sampled at cell centres, with the measured face fixed by the right-handed cross product of the normalized axes, so a 1x1 grid measures the middle and the face is a declaration, not an inference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Origin, two axes, two sizes and two counts describe any planar grid, horizontal, tilted or vertical, with no separate shape per orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The measured face is never chosen by which answer is brighter, and non-perpendicular axes give a parallelogram rather than being silently orthogonalized.

## @evidence contracts/development/common.md#meaningful-documentation

States the cell-centre sampling, the measured face rule and how swapping axes flips it, normalization without orthogonalization, the metre unit, the count and size ranges, and the sample cap.
