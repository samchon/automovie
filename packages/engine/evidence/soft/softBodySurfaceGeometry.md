# src/soft/softBodySurfaceGeometry.ts#softBodySurfaceGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Cross-product accumulation gives area-weighted vertex normals and the lattice's fixed winding; compatible domain/state dimensions and finite positions are caller premises. Direct-square normalization can overflow/underflow for extreme ungated geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One surface owner converts the particle field rather than giving a viewer an independent cloth solution; current production/viewer wiring does not consume this rendering projection API.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sliver triangles invent a surface for one-row/column lattices; +Y is the declared zero-normal fallback, not a repaired physical normal, and indexed-only bounds are explicit.

## @evidence contracts/development/common.md#meaningful-documentation

States array ownership, winding, UVs, fallback normal, bounds scope and compatibility premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P particles and Q quads, UVs, indices, triangle-normal accumulation, normalization and indexed bounds cost O(P+Q) with O(P+Q) output and O(P) temporary accumulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each face cross product is computed once and shared by its three vertices; dynamic state positions require fresh normals/bounds rather than a stale mesh cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All returned arrays and bounds are fresh caller-owned values; source state positions are copied, accumulation is discarded, and no GPU resource is acquired.
