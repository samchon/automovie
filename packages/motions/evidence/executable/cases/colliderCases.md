# src/executable/cases/colliderCases.ts#colliderCases

## @evidence contracts/development/common.md#meaningful-documentation

States the pose, both directions, every bound with its reason and the side measured.

## @evidence contracts/development/implementation.md#principled-implementation

Measures the profile's own shapes by the engine's shape distance against the triangles the viewer's own builder draws.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the drawn meshes and one over the collider samples, four maxima.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the built drawing and the built profile, not the ring owner both come from; a shape kind it cannot sample throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every sample is tested against the triangles of one side of one body, a few thousand.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Disposes each drawing once its triangles are copied.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per run.
