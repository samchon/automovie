# src/drawing/autoMovieDrawingCellVolume.ts#autoMovieDrawingCellVolume

## @evidence contracts/development/implementation.md#principled-implementation

Vertex enumeration by solving every plane triple with Cramer's rule, a hull per supporting plane, and the cone decomposition `sum(area * height) / 3` about an interior point, which is exact for a convex polyhedron; the closed-surface test uses the divergence-theorem identity that a closed surface's vector area is zero, and the limitation is that vertices and planes are welded on fixed tolerances, so a cell thinner than a micrometre measures as degenerate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns normalization, deduplication, vertex enumeration, face hulls and the closure test; the plane solve and the face basis are private helpers because no other caller needs them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cell shape is special-cased; an unbounded or degenerate cell returns `null` for the caller to report as a gap rather than a placeholder volume, and duplicate planes are merged because they bound nothing new, not to fix a particular input.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the half-space convention, the algorithm, what `null` covers and how the open-cell case is detected, the duplicate-plane rule, the normal premise and the units.

## @evidence contracts/development/implementation.md#efficient-algorithms

For `p` distinct planes, enumeration solves `p^3 / 6` triples and checks each corner against every plane, so time is `O(p^4)`, followed by one hull per plane over the `v` vertices; this suits authored cells of a handful of planes, where a half-space intersection algorithm with better asymptotics would add a dual-hull construction for no measurable gain.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one cell's planes, called once per cell per quantity report, so no equivalent work repeats inside it or across its callers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the plane, vertex and key collections for one call and returns a number; nothing outlives the call.
