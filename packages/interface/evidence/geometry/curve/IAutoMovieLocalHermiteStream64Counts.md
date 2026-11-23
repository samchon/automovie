# src/geometry/curve/IAutoMovieLocalHermiteStream64Counts.ts#IAutoMovieLocalHermiteStream64Counts

## @evidence contracts/development/design.md#principled-representation

Integer output counts are separate from the millimetre Taylor estimate; one cell is counted only on its first range across chunk boundaries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

tessellateAutoMovieLocalHermite64 publishes these counters beside geometry and face ranges for chunk diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unnormalizable analytic normals remain zero and zero-area triangles are counted explicitly; no replacement geometry is credited.

## @evidence contracts/development/common.md#meaningful-documentation

Defines count scope, cell continuation, nonfinite-area failure and estimate limitations.
