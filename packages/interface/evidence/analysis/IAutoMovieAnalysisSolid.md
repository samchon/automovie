# src/analysis/IAutoMovieAnalysisSolid.ts#IAutoMovieAnalysisSolid

## @evidence contracts/development/design.md#principled-representation

A convex solid as an intersection of half-spaces, tested by the analytic slab method; it relies on convexity, which a half-space intersection always has, and does not check boundedness or non-emptiness, as stated.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One shape serves both context occluders and building shades, so a single occlusion routine reads both while the caller keeps ownership by choosing the list.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Context masses are never returned as building geometry, and an unbounded plane set is accepted as authored rather than rejected by an unstated heuristic.

## @evidence contracts/development/common.md#meaningful-documentation

States the inside convention, the stop rule including a ray starting inside, what validation checks and leaves unchecked, the four-plane minimum, and that ids are unique only within their own list.
