# src/geometry/curve/tessellateAutoMovieLocalHermite64.ts#tessellateAutoMovieLocalHermite64

## @evidence contracts/development/implementation.md#principled-implementation

Exact local Hermite tensors, Bernstein derivative bounds, adaptive binary restrictions and shared parameter-boundary triangulation preserve supplied curves and shared boundaries before binary64 rounding. Matching extruded polygons use fiber edges rather than an additional curved center.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two-interval lookahead owns station edge samples; local line registries insert hanging corners without propagating a global phase partition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source mesh, coordinate weld, omitted source knot, hidden limiter, arbitrary run split or fallback normal supplies the result.

## @evidence contracts/development/common.md#meaningful-documentation

States units, append-only indexing, approximation bound, derivative authority, failure effects and separate geometric qualifications.

## @evidence contracts/development/implementation.md#efficient-algorithms

Field admission is O(N+S); local interval construction uses at most four source partitions. For L retained cells, refinement is O(L), line sorting O(L log L), and each ordered cell perimeter triangulates in linear sample count before evaluations and logarithmic line queries, without S times global-knot storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjacent interval plans share one station sample union and one position/normal/index owner. Local vertex identity, not coordinate equality, reuses internal boundary vertices.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The generator retains source admission, two bounded interval plans, current-interval vertices and two station edge maps, plus one vertex-bounded output chunk. Completed interval maps are released; yielded chunks belong to the consumer. Cancellation releases generator-owned state and no external handles exist.
