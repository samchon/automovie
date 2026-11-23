# src/core/IAutoMovieNode.ts#IAutoMovieNode

## @evidence contracts/development/design.md#principled-representation `composeScene` turns each node into `parent world × compose(translation, rotation, scale)` with a real 4x4 product, memoized per id and guarded by an in-progress set, so declaration order is free and a cycle, duplicate id or missing parent throws; the premise of finite TRS and a unit rotation is left to the producers of the list and is not rechecked there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record per node with a single parent reference keeps the hierarchy a forest the engine can index in one pass, and payloads are ids rather than nested objects so meshes, cameras and lights stay owned by their own tables.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No node kind is special-cased by the resolver, which reads only id, parent and transform; multi-parent relationships are expressed as drivers rather than patched into the hierarchy. The descriptive `kind` and payload ids are not cross-checked, a gap stated here rather than hidden.

## @evidence contracts/development/common.md#meaningful-documentation

States the parent-local frame of the transform, the single-parent forest rule, what `composeScene` refuses and does not check, which fields the resolver reads, and that a transform is the rest pose when no channel animates it.
