# src/scene/instancedModelParts.ts#instancedModelParts

## @evidence contracts/development/implementation.md#principled-implementation

Collects actual isMesh nodes in Three's existing traversal order so merged part indices and cycle matrix rows consume one common order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal helper owns rigid-part enumeration rather than each instancing consumer deriving its own ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No node name or fixture ordering is substituted for actual traversal, and this collection does not admit anatomical partitions or alter meshes.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation explains the shared part-index/matrix-row contract and why ordering must agree across flattening and cycle baking.

## @evidence contracts/development/implementation.md#efficient-algorithms

A single N-node traversal retains P matching mesh references, costing O(N) time and O(P) result space without geometry copying.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumers share this enumeration rule but each call observes the current object tree; no old parts array is cached across graph changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned mesh references borrow the model owner's objects and keep them reachable while used; no geometry, texture or native renderer handle is acquired.
