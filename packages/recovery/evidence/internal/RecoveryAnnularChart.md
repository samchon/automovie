# src/internal/RecoveryAnnularChart.ts#RecoveryAnnularChart

## @evidence contracts/development/implementation.md#principled-implementation

Dijkstra selects a shortest physical edge path between deterministic incidence anchors, excluding other boundary vertices. Removing its incident edges from each vertex link separates two oriented triangle fans and duplicates only the seam observations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private helper owns seam selection, fan duplication and square-side ordering; harmonic parameterization and polynomial fitting remain separate consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No positional weld, arbitrary bridge, copied normal, anatomical seam or output mesh is generated. An absent simple anchored path or ambiguous oriented fan fails explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

States required annulus topology, physical units, deterministic anchors, private-data lifetime and local unsupported cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V chart vertices and F triangles, adjacency and incidence use O(V+F) space. Heap Dijkstra costs O((V+F)log(V+F)); local seam-link traversal costs the total incident seam-face population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One oriented edge registry serves path adjacency, vertex-link separation and boundary checks; no source-wide extraction or duplicate chart solve occurs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All graph and heap state expires on return or failure; at most one duplicate per seam vertex plus remapped private triangles transfers to the observation caller. Nothing is published to the reconstruction consumer.
