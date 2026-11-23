# src/pose/IAutoMovieJointRotationDomain.ts#IAutoMovieJointRotationDomain

## @evidence contracts/development/design.md#principled-representation

Choosing among exact inverse charts by the caller's own ROM is a lossless choice, because every candidate reconstructs the same quaternion; the score is the gate's `jointRomOvershoot`, so the chosen reading is the one the gate judges most leniently without altering the rotation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bone and its resolved constraint travel together because the overshoot measure needs both, and the constraint is already resolved by the caller so the inverse never consults defaults or rig tables.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The constraint only ranks readings; no angle is clamped or wrapped beyond a full-turn alias inside the declared interval, so a refused pose remains refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the consumer, the selection rule with its tie-break, the no-clamp guarantee, what `null` means, and who supplies it.
