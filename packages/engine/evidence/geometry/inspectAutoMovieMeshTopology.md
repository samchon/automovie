# src/geometry/inspectAutoMovieMeshTopology.ts#inspectAutoMovieMeshTopology

## @evidence contracts/development/implementation.md#principled-implementation

Count undirected edge incidence over physical ids or rounded-position keys: one use is boundary and more than two is nonmanifold. The nonempty two-use census reports watertightness by edge incidence. The caller still evaluates vertex manifoldness, winding, degeneracy and finiteness for full validity. Volume sums signed tetrahedra against the origin, subject to binary64 overflow and cancellation. The paired entry point uses the same physical identity relation for topology and edge-connected pieces. See [CGAL Polygon Soup Repair](https://doc.cgal.org/6.2/PMP_Mesh_repair/index.html) and [libigl facet components](https://libigl.github.io/dox/facet__components_8h.html).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measurement only; the pass/fail verdict lives in `validateMeshTopology`, and the weld, with its index admission and physical identity, in `weldAutoMovieMeshCorners`, which `measureAutoMovieMeshPieces` shares so the two reports cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The standalone and paired paths apply the same index, finiteness and physical-correspondence admissions. The weld grid is the shared `MESH_WELD_GRID` constant rather than a local tolerance, degenerate triangles are reported instead of dropped silently, and an empty mesh is not watertight because having no edges is not having no holes.

## @evidence contracts/development/common.md#meaningful-documentation

States identity modes, coordinate-weld degeneracy, attribute finiteness, edge-census limits, units and signed volume, the separate validator and named index/physical-source refusals. The paired API documents use of the shared corner weld and the piece reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in vertices and triangles: one finiteness pass per attribute without concatenating them, and one hashed edge count per triangle edge keyed by the welded identity pair. The paired entry point computes the weld once and reads piece incidence only when requested.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A standalone call measures the mesh and returns its report. The paired `prepare` call passes the same prepared corner lattice identities to topology and to the piece reader, which computes its census on each request.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local storage includes one welded identity per corner, at most three edge keys per triangle, a generated index run for nonindexed input and the optional physical-vertex correspondence. The standalone report owns only its output. The paired piece reader retains the corner identities and their count for that invocation. It retains no mesh attributes, incidence map or previous piece result.
