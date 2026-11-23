# src/geometry/measureAutoMovieMeshDefects.ts#measureAutoMovieMeshDefects

## @evidence contracts/development/implementation.md#principled-implementation

A half-edge incidence census over position-welded corners: an undirected edge of a closed oriented 2-manifold is used by exactly two triangles in opposite directions, so one use, more than two uses and two same-direction uses are each a defect. Direction is recorded as whether the traversal runs from the lower welded id to the higher. Lattice indices are exact integers up to 2^53; past that the product's own binary64 spacing is wider than a cell and vertices weld by their rounded value. The aspect divides by the cross product's length, which is twice the area. Vertex-manifoldness and self-intersection are outside an edge census and remain unmeasured.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, welding, one census pass and one emission pass, with the welding, the aspect and the edge verdict in local helpers. It does not call `weldMeshVertices` or `triangleIndicesOf`, which take `number[]`, fix the grid and copy the index run, where this must read typed arrays in place under a caller's grid. `inspectAutoMovieMeshTopology` keeps the counts and the volume; this owns the located list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The default grid is the shared `MESH_WELD_GRID` and the sliver limit is the caller's parameter, with no built-in tolerance. Malformed buffers are refused instead of truncated, degenerate triangles are reported instead of dropped, and a vertex with a non-finite coordinate is refused instead of welded with every other such vertex. The vertex bound is the largest count whose square is a safe integer, which the packed keys need to stay exact.

## @evidence contracts/development/common.md#meaningful-documentation

States the buffer layout and unit freedom, the weld rule and its default, each kind's condition, the aspect formula with reference values, the output order, every refusal and what an edge census cannot find.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in vertices V and triangles T. Each vertex costs five hashed lookups that intern its three axis indices, its xy pair and its cell as numbers, and each triangle edge one lookup on the key `low * V + high`; no key is a string, and the packing is collision-free because every interned ordinal is below V. Space is one 32-bit cell id per vertex, one 32-bit edge ordinal per corner, one byte per triangle and two counters and one flag per distinct edge. A `Map` cannot hold more entries than its engine allows, about 16.7 million in V8, which bounds distinct cells and edges below the vertex bound.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures the buffers it is given and keeps nothing between calls, so a caller that needs the list twice keeps the first one.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The weld tables, the edge table and the typed arrays are local to one call and are garbage once it returns or throws. Only the returned list survives, and it holds vertex indices, not the mesh.
