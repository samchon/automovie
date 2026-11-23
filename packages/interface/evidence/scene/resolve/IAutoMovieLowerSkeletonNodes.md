# src/scene/resolve/IAutoMovieLowerSkeletonNodes.ts#IAutoMovieLowerSkeletonNodes.IProps

## @evidence contracts/development/design.md#principled-representation

An admitted skeleton plus optional identity prefix and root parent describes lowering in bone-rest coordinates, with identity root and unit scales.

## @evidence contracts/development/design.md#minimal-and-owned-surface

lowerSkeletonNodes reuses the canonical skeleton and keeps placement parenting separate from the rig's rest geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lowering borrows bone translation/rotation, so a fresh node array is not a deep copy; rig admission remains the caller's responsibility.

## @evidence contracts/development/common.md#meaningful-documentation

Documents prefix/root defaults and borrowed versus fresh transform members.
