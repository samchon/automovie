# src/geometry/IAutoMovieModelCrossing.ts#IAutoMovieModelCrossing

## @evidence contracts/development/design.md#principled-representation

Each count is the length of `measureAutoMovieMeshCrossings`'s per-triangle report in one direction, a strict segment-through-triangle test where touching is not crossing, so a seam shared by two shells contributes nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One entry per crossing pair with both sides' counts, which is what the face panel diffs between a before and an after reading and the body contact watch displays; the per-triangle reports stay inside the measurement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No part, pose or asset is exempted and no allowance subtracts expected layering; the entry reports geometry, and judging whether a crossing is intended stays with the caller's before-and-after comparison.

## @evidence contracts/development/common.md#meaningful-documentation

States the identity source, why both directions are kept, the self-entry convention, what coplanar separates and how it sums for a pair versus a self entry.
