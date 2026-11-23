# src/geometry/measureAutoMovieMeshClearance.ts#measureAutoMovieMeshClearance

## @evidence contracts/development/implementation.md#principled-implementation

The depth difference between two planar triangles is affine on their projected intersection polygon, so its minimum lies at a polygon vertex; Sutherland-Hodgman clipping of the front triangle against each back triangle's three edges yields exactly those vertices, including crossing edges that a vertex-only test misses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission uses `triangleIndicesOf`, a private 2D box tree prunes back triangles, and the clipping and barycentric helpers are local because they serve only this projected measure; `minimizeAutoMovieMeshClearance` consumes the witnesses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Box overlap is inclusive so touching triangles, which can own the minimum, are never pruned, and the clipping parameter is formed from normalized side values so finite inputs cannot overflow into a false crossing; parallel triangles are skipped by the stated rule.

## @evidence contracts/development/common.md#meaningful-documentation

States what each entry means and its sign, the unreported case, the projection plane per axis, what the measure is not, frame ownership, the witness receiver's purpose, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For f front and b back triangles, building the back tree costs O(b log^2 b) and each front triangle visits only back triangles whose projected boxes overlap its own, clipping each in constant time, so the work follows the k overlapping pairs rather than f times b.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures one pair of surfaces in their current positions; a caller that repeats a pair after moving vertices needs a new measurement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the projected triangles and the back tree for the call and returns one small record per overlapping front triangle; each witness passed to `visit` owns its vertex and weight arrays, so the receiver may keep it.
