# src/geometry/sweep/rigAutoMovieSurfaceBridge.ts#rigAutoMovieSurfaceBridge

## @evidence contracts/development/implementation.md#principled-implementation

Cubic Hermite blending between two loops with end directions in the joined surfaces' tangent planes, the explicit rule for a branch or a junction band, with the loop tangent taken at the scale of the first row as an offset curve takes it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

All per-pose state is three small buffers; the network rig decides vertex identities and probes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing curve normals or directions are refused by the curve's rig, not substituted.

## @evidence contracts/development/common.md#meaningful-documentation

States the column curve, every direction rule and why the across chord spans a first row.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n columns of r rows: O(n) arc lengths per loop, an O(n) walk per across direction, and O(n r) interior points; nothing allocates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Hermite weights per row and arc lengths per loop are computed once per call and shared by every column.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the index arrays and O(n + r) numbers of arcs, weights and scratch.
