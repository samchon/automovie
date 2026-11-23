# src/geometry/trianglesOf.ts#trianglesOf

## @evidence contracts/development/implementation.md#principled-implementation

Visibility bridges convert canonical disjoint holes into one weakly simple boundary, then convex-ear removal covers that boundary without adding vertices; canonicalRegion establishes containment and winding for triangulateRegion and meshAutoMovieSweep, while PLANAR_EPSILON bounds the determinant predicates and can refuse numerically thin ears.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bridges and ear clipping stay beside their private visibility predicates because they share indexed boundary identities; canonicalRegion owns validation separately so lofts need triangulate only their two end caps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ear checks retain points on proposed diagonals and ignore only repeated bridge endpoints with the same identity; an exhausted search throws rather than inventing a fan or filling a hole.

## @evidence contracts/development/common.md#meaningful-documentation

States canonical winding and admission prerequisites, unchanged point identities, collinear boundary preservation, output layout and numerical search failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N boundary occurrences and H holes, ear removal costs O(N cubed) worst case. A bridge search may inspect O(N squared) endpoint pairs against O(N) edges and repeat after each of H joins, giving O(H N cubed) worst-case bridging; working rings and triangles occupy O(N) storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Every call triangulates one region layout; loft reuses a section layout while requesting triangles only for its end caps, and no cache survives mutable points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Working loops, shapes and bridge candidates exist only during triangulation and scale with region size; the caller receives only the new index array, with no retained point references.
