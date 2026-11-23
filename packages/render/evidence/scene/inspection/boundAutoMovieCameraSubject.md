# src/scene/inspection/boundAutoMovieCameraSubject.ts#boundAutoMovieCameraSubject

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units, skin padding and the undefined outcome.

## @evidence contracts/development/implementation.md#principled-implementation

An affine image of an enclosing local box encloses the transformed vertices; the skin box is the exact CPU pose extent padded by AutoMovieSkinnedMesh.tolerance, so every vertex the GPU draws lies inside.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission stays with listAutoMovieCameraSubjectMeshes; this only unions the admitted local bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rest or culling sphere never stands in for the posed skin, and one missing contribution refuses the whole subject.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per rigid mesh with a cached geometry box; a skin costs one O(V) pose evaluation only when its pose key changed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses Three's geometry box and the skin's pose cache, which its writers invalidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one new box; a rigid geometry may keep the bounding box Three computes on first use.
