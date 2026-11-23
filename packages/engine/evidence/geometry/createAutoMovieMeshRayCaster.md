# src/geometry/createAutoMovieMeshRayCaster.ts#createAutoMovieMeshRayCaster

## @evidence contracts/development/implementation.md#principled-implementation

Moller-Trumbore ray-triangle intersection over a median-split bounding volume hierarchy traversed with the slab test, shrinking the accepted interval to the running nearest travel so the result is the true minimum over admitted intersections; the equal-travel tie keeps the lowest original ordinal so the attributed face does not depend on traversal order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission is `triangleIndicesOf`'s, construction lives in module-level helpers that receive the corner table, and one private `cast` serves all three queries, which differ only in whether they keep identity and whether they stop early.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-18 determinant threshold is the one stated parallelism cutoff and the representation fallbacks change only how a value is computed, never which ray or triangle counts; self-hits are avoided by exclusions or minimum travel, never by moving the origin.

## @evidence contracts/development/common.md#meaningful-documentation

States the snapshot, the hierarchy, what each query returns and its tie rule, the travel interval and defaults, exclusions, the winding, edge and grazing rules, what a miss means, and every refusal and representation fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction sorts each node's span, O(n log^2 n) for n triangles; a query visits only nodes whose slab interval meets the running nearest travel, following the triangles near the ray with an O(n) worst case, and `blocked` stops at its first admitted hit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The hierarchy, the edge table and the traversal stack are built once per caster and reused by every query, which is what lets the hair builder compile one caster per host skin and share it across all strands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The queries retain nine float64 edge values and one ordinal per triangle, six bounds and four integers per node with fewer nodes than triangles, and a stack of twice the node count; the corner table and the construction lists live only in the build helpers and are garbage after creation, and nothing grows per query.
