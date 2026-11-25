# src/geometry/measureAutoMovieMeshPieces.ts#measureAutoMovieMeshPieces

## @evidence contracts/development/implementation.md#principled-implementation

Pieces are the components of the triangle graph joined through welded edges, found by a disjoint-set forest. A vertex is one fan when its corner slots are joined through the edges at that vertex. A manifold piece whose incident triangles already traverse every shared edge oppositely has a witnessed orientation. Other manifold pieces use a breadth-first two-colouring across the two-triangle edges. [Armstrong, section 7.2](https://math.mit.edu/~hrm/palestine/armstrong-basic-topology.pdf). The genus is `(2 - euler - boundaryLoops) / 2` from the classification of compact surfaces, reported only where its manifold and orientable premises hold. Boundary loops are the components of the one-triangle edges, which equal the loops on a manifold piece.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The weld is shared with `inspectAutoMovieMeshTopology` through `weldAutoMovieMeshCorners`, so both reports identify corners and degenerate triangles the same way. Each edge stores one list of signed one-based triangle ordinals. Their signs preserve every direction, including at a nonmanifold edge. The census gathers edges, pieces and fans once; `summarize` and `orientableOf` read one gathered piece each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance beyond the shared `MESH_WELD_GRID` weld is introduced, degenerate triangles are skipped exactly as the topology report skips them, and a genus is never reported where its formula does not apply.

## @evidence contracts/development/common.md#meaningful-documentation

States the weld and its owner, what joins a piece, every reported quantity, the manifold, orientable and wound definitions and how they differ, the genus formula and its premise, the order, the empty case and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Near-linear in triangles: one hashed edge record per triangle edge, union-find with path halving for pieces, fans and loops, and one breadth-first pass for a manifold piece whose stored winding is inconsistent. Closed pieces allocate no boundary forest.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures the mesh it is given and keeps nothing, so a caller that needs the census twice keeps the first.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local storage is the weld, the edge map, two forests sized by triangles and corners, and per-piece tallies; only the returned records survive.
