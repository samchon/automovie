# src/geometry/construction/fairAutoMovieSolidMesh.ts#fairAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

The discrete thin-plate energy of the umbrella operator is the standard C1 fairing fill (Kobbelt et al. 1998; Botsch and Kobbelt 2004); two fixed rings give the solve its positional and tangential boundary conditions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass welds and gathers the regions, one assembles the operator and one solves; the caller owns where the regions are.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moves no vertex outside a region, changes no index and no chart coordinate; a region without sources, a source that is not a vertex, or a radius that is not positive and finite, is a thrown premise, never skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States the energy, its weights and why not the cotangent ones, the boundary rings, the welding, the region's reach from its sources, the solver and what a moved vertex keeps.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear scan of the positions, through a hash of cells as wide as the largest reach, and one of the triangles keep only what lies near a source; each region is gathered by Dijkstra's search from all its sources with a binary heap, and conjugate gradients take at most as many matrix-free products as the regions have vertices, each linear in their edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The operator is assembled once for all three coordinates and every overlapping region.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local maps and arrays die with the call; only the mesh's positions are written.
