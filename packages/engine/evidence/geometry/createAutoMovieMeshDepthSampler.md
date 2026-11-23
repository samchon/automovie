# src/geometry/createAutoMovieMeshDepthSampler.ts#createAutoMovieMeshDepthSampler

## @evidence contracts/development/implementation.md#principled-implementation

Barycentric point-in-triangle tests on the projected triangles with depth interpolated by the same weights, which is exact for planar triangles; the index is a uniform 32 by 32 grid over the projected extent, each triangle registered in every cell its projected box touches, so a query point's cell holds every triangle that can cover it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index admission is delegated to `triangleIndicesOf`; this function owns only the projection, the grid and the envelope query, returned as a closure over the snapshot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-10 barycentric slack only keeps shared edges inside both neighbours and never lets a point far outside a triangle count; zero-area projections are skipped by the stated rule instead of being sampled.

## @evidence contracts/development/common.md#meaningful-documentation

States the query plane per axis, frame and unit, the envelope meaning and edge rule, the skipped parallel faces, the snapshot, and every refusal at creation and query.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creation is linear in triangles plus the grid cells each projected box covers; a query reads one cell, so its cost is that cell's triangle count, small for the evenly spread surfaces it serves and at worst every triangle when one triangle spans the whole grid.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The projected triangles and the grid are built once per sampler and reused by every query; the sampler itself is the caller's to keep for as long as the mesh is resident.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the projected corners of every non-degenerate triangle and a map of at most 1,024 cells holding triangle references, all sized at creation and released when the caller drops the sampler; no callback captures the caller's mesh, so it is not kept alive.
