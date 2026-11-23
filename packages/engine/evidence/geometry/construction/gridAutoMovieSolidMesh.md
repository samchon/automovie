# src/geometry/construction/gridAutoMovieSolidMesh.ts#gridAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Keeps the original analytic grid readings and point metric, excludes potentially cut full cells, and prepares original-source and residual membership separately from the sampling margin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local record carries provisional points, indexed constraints and full-cell triangles; domain assembly and residual triangulation have separate owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing retained grid is not an empty source. No trim index is reconstructed/welded, no full cell is admitted solely from corner flags and no mesh mutation occurs before all downstream planning succeeds.

## @evidence contracts/development/common.md#meaningful-documentation

States copied-jet lifetime, station-major exceptions, foreign-owner face charts, conservative cell exclusion and immutable-source premise. Periodic trim primitives use the local half-period family consumed by the existing kept-side reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads G grid jets once and performs O(G(S+L)) true-cut classification, conservative cell tests over only the barriers whose station range meets each cell's interval (bucketed once in O((S+D) R) for R intervals) and O(G(S+D)) boundary-contact scans for S cut segments, D domain authority segments and C cells. Domain work and the cost of each source predicate are additional, not constant-time assumptions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares station/phase spacings, copied jets and grid-index reservations; source readers and full-cell lookup serve all residual queries within this face.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

O(G+S+L) grid/constraint/catalogue state is local; returned closures retain their source readers and cell table only until the caller finishes this face, with no global cache.
