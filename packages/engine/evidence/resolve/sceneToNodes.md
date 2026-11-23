# src/resolve/sceneToNodes.ts#sceneToNodes

## @evidence contracts/development/implementation.md#principled-implementation

Lower scene placements/cameras/lights and registered skeleton/articulation subtrees into rest nodes, requiring registry resolution unless explicit partial-model policy applies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Skeleton lowering/prefix helpers own shared representation and composeScene owns graph uniqueness/parent/cycle admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Registry conflicts/missing required models throw; placements-only, rigid and partial modes are current caller policies, not fixture omissions.

## @evidence contracts/development/common.md#meaningful-documentation

Props identify registry keys, partial semantics and borrowed transforms; skeleton roots are fresh while scene/articulation nested data remains borrowed.

## @evidence contracts/development/implementation.md#efficient-algorithms

P placements, C cameras, L lights and B/J lowered bones/joints require proportional node wrappers/id text, without geometry or population expansion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All lowering uses shared naming; mutable scene/model records prevent retaining a graph solely by scene id.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns node wrappers/array and source transforms remain borrowed; partial arrays release on failure without native graph handles or tasks.
