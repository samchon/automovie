# src/geometry/placeAutoMovieModelPartMesh.ts#placeAutoMovieModelPartMesh

## @evidence contracts/development/implementation.md#principled-implementation

Applies the part's column-major model matrix to every position through `transformAutoMovieDrawingPoint`; a null matrix means the part is authored in the model frame, so its mesh is returned untouched rather than multiplied by an identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one placement step that model crossings, model contacts and the form expectation check share; the matrix itself stays with `autoMovieModelPartMatrices` and index admission with `triangleIndicesOf`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No part is exempted and no tolerance is applied; only positions change and the other buffers are shared unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix's owner and composition, the null case, which buffers move and which are shared, units and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in vertices, with one index admission pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call places the mesh it is given; callers keep the placed mesh for their pairs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned mesh owns one new position array and borrows every other buffer from the input.
