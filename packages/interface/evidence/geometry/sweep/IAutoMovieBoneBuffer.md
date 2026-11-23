# src/geometry/sweep/IAutoMovieBoneBuffer.ts#IAutoMovieBoneBuffer

## @evidence contracts/development/design.md#principled-representation

The per-joint rigid transform of skinning, held as one quaternion and two origins per bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Bones are addressed by their index in the rest list, resolved once by name when a rig compiles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `update` refuses a posed list whose bones differ from the rest list rather than matching them by search.

## @evidence contracts/development/common.md#meaningful-documentation

States the transform, the identity state and the addressing.
