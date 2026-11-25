# src/geometry/createAutoMovieMeshWindingQuery.ts#createAutoMovieMeshWindingQuery

## @evidence contracts/development/implementation.md#principled-implementation

The generalized winding number of Jacobson, Kavan and Sorkine-Hornung (2013) sums each triangle's signed solid angle by the Van Oosterom and Strackee (1983) half-angle closed form, so it needs no manifold, closure or embedding premise and reads open, overlapping and reversed surfaces as the share of the view they cover. Solid angles are singular on the surface, so the same pass applies the area-scaled on-triangle test that built-space shells have used, and `inside` excludes surface points. A triangle whose doubled area is at most 1e-12 m2 is skipped: its exact solid angle is zero, while the formula would return plus or minus 2 pi at a point on its line. Results are binary64 sums, not exact certificates near the surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One factory admits and snapshots, one closure answers a point, and two private helpers own the on-triangle plane and edge tests. `builtSpaceContainsPoint` calls this query instead of keeping its own sum; render's collision witness keeps its fused distance-and-angle pass over three.js vectors, which this query cannot replace without a second pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 0.5 threshold is the midpoint between the winding values of empty and solid space. The 1e-9 surface slack and the 1e-12 m2 zero-area limit are the constants `builtSpaceContainsPoint` used, kept so its answers do not change. No far-field approximation, ray choice or consumer special case is used.

## @evidence contracts/development/common.md#meaningful-documentation

States the method with both citations, the threshold and its sign convention, the surface test and its slack, the zero-area rule, the snapshot, units and frame, and every admission and query refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission is linear in triangles. Each query is one pass over the kept triangles with no allocation besides its result, so its cost is the triangle count; callers bound the number of points. No hierarchy is built because no consumer has measured a need for one.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The indexed positions are copied once per mesh. Every retained corner points into that snapshot and each kept normal is calculated once. All queries share that preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains three Float64 values per vertex and three Uint32 offsets plus three Float64 normal values per input triangle. It fills the kept prefix directly without staging an unbounded native array. Each call allocates only its result.
