# src/drawing/autoMovieBoundaryFacePoint.ts#autoMovieBoundaryFacePoint

## @evidence contracts/development/implementation.md#principled-implementation

A rigid transform, rotation by the face quaternion followed by translation to its origin, maps face-local coordinates to world exactly; the unit-quaternion premise holds because building validation refuses a face rotation off unit norm by more than 1e-6.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One face-to-world placement shared by the boundary shell triangulation and the opening marks, so a drafted wall and the void drawn on it are placed by the same frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No face orientation is special-cased or flattened to a heading; the rotation is applied as stated.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the formula, the local plane and depth axis and that its outward sense is unchecked, the units, how the shell uses depth, the unit-quaternion premise, and the effect of breaking it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, one quaternion rotation and one addition, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure per-point map that coordinates no work across calls; callers place each outline point once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the local offset and the returned point, and retains nothing.
