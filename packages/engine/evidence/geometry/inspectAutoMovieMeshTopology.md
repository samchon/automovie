# src/geometry/inspectAutoMovieMeshTopology.ts#inspectAutoMovieMeshTopology

## @evidence contracts/development/implementation.md#principled-implementation

Count undirected edge incidence over physical ids or rounded-position keys: one use is boundary and more than two is nonmanifold. The nonempty two-use census supplies watertight, not a full vertex-manifold, winding, nondegeneracy or finiteness proof; volume sums signed tetrahedra against the origin, subject to binary64 overflow and cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measurement only; the pass/fail verdict lives in `validateMeshTopology`, and the weld, with its index admission and physical identity, in `weldAutoMovieMeshCorners`, which `measureAutoMovieMeshPieces` shares so the two reports cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weld grid is the shared `MESH_WELD_GRID` constant rather than a local tolerance, degenerate triangles are reported instead of dropped silently, and an empty mesh is not watertight because having no edges is not having no holes.

## @evidence contracts/development/common.md#meaningful-documentation

States identity modes, coordinate-weld degeneracy, attribute finiteness, edge-census limits, units and signed volume, the separate validator and named index/physical-source refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in vertices and triangles: one finiteness pass per attribute without concatenating them, and one hashed edge count per triangle edge keyed by the welded identity pair.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A standalone call measures the mesh and retains only the report. A caller needing the piece census can use `prepare` to share its corner weld.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local storage includes one welded identity per corner, at most three edge keys per triangle, a generated index run for nonindexed input and the optional physical-vertex correspondence. Only the returned degenerate ordinal list and scalar report survive; no mesh or topology cache is retained.

# src/geometry/inspectAutoMovieMeshTopology.ts#inspectAutoMovieMeshTopology.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Both diagnostics operate on the same corner identities. Polygon soups need an explicit incidence representation before computing topology. [CGAL Polygon Soup Repair](https://doc.cgal.org/6.2/PMP_Mesh_repair/index.html). The topology report uses the existing edge counts and signed volume, and edge-connected pieces use the existing directed incidences. [libigl facet components](https://libigl.github.io/dox/facet__components_8h.html).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the computed topology and a piece census function for that same weld. The two independent edge passes keep the whole-mesh report and the piece report in their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the ordinary finiteness, degenerate and volume rules and identical index and physical-source admissions. It does not tolerate a malformed input or infer winding from the whole-mesh edge counts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Represents all corners and validates correspondence once for the paired reports. The piece census runs only when requested, with its ordinary incidence costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two reports share one explicit corner weld created when the enclosing mesh inspection is prepared. The function reads that weld and recomputes the census on request, with no mesh-keyed lookup or remembered prior result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Between reports the consumer owns a completed topology record and a function over one read-only corner identity array and the identity count. It retains neither mesh attributes nor either incidence map. Dropping the function releases the identities.

## @evidence contracts/development/common.md#meaningful-documentation

States when to prepare both reports, their shared weld, result ownership and ordinary malformed-input refusals.
