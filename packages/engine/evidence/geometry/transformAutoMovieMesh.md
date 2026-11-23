# src/geometry/transformAutoMovieMesh.ts#transformAutoMovieMesh

## @evidence contracts/development/implementation.md#principled-implementation

An affine map `x -> R(S x) + t` applied per vertex, with normals mapped by the inverse transpose `R S^-1` and renormalized, and two triangle corners swapped when `det S < 0` so the right-hand-rule normal still points outward; the premise of a unit rotation and nonzero scale is enforced before any vertex is written, and the remaining limitation is that UVs stay in the unscaled metric, as documented above.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns placement for every attribute a rigid mesh can carry, reusing `triangleIndicesOf` for index admission and `resolveAutoMovieMeshPhysicalVertices` for correspondence, so part merging, portrait optics and face-preserving placement all place a mesh the same way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A skinned mesh, a non-unit rotation and a collapsing scale are refused rather than repaired, and physical correspondence is re-admitted after placement instead of trusted, so a placement that separates aliases fails here rather than in a later merge.

## @evidence contracts/development/common.md#meaningful-documentation

States how each attribute is mapped, why UVs are not rescaled and what that costs, the frame dependence of polyhedron atlases, the physical-correspondence rule, the ownership of the result, and every refusal with its tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and T triangles, positions and normals take one rotation each and indices one copy, O(V + T), plus two linear correspondence resolutions when physical vertices are present; this is the output size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call places one mesh under one transform into buffers the caller owns, so there is nothing to share across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the resolved correspondence tables are discarded after admission, and the new position, normal, UV, color, relief, index and correspondence arrays, linear in V and T, are transferred to the caller.
