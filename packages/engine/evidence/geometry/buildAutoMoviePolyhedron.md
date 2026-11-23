# src/geometry/buildAutoMoviePolyhedron.ts#buildAutoMoviePolyhedron

## @evidence contracts/development/implementation.md#principled-implementation

A convex polygon is planar, turns one way at every corner and has total turning 2 pi; the function checks exactly those three facts against the normal of the first non-straight corner before fanning, and the UV frame is a fixed function of that normal so coplanar faces share coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, the normal-derived UV frame and emission are separated into `faceNormal`, `surfaceUvFrame` and the main loop, and the only tolerance is `FACE_EPSILON` shared by the area, planarity and turn tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Faces are refused, never repaired, and the UV frame never depends on which corner the author typed first; `LEVEL_FACE_LIMIT` is the declared conditioning switch between the two frame rules, not a per-asset value.

## @evidence contracts/development/common.md#meaningful-documentation

States the purpose, ordering and ownership, the full UV rule with its seams and why, how the normal is chosen, every refusal, why convexity is required, and who checks closure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the total corner count: each face takes one pass for the normal, one for planarity, one for turning and one to emit corners and fan indices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One mesh per face list; a caller placing the same solid repeatedly can keep the returned mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new position, normal, UV and index arrays sized by the corner count; per-face normals and frames are released as each face finishes.
