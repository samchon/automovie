# src/handling/HumanHeldEffector.ts#HumanHeldEffector

## @evidence contracts/development/common.md#meaningful-documentation

States what is fixed, the turn in degrees, the hand-axis weights returned and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A held prop is rigid in the hand, so the contact's point and normal from the grip socket are fixed; an upright vessel's rim is the ring about its axis (the normal) through the point, centred on the axis through the prop's origin, and a turn moves the point round it with the facing outward; the weights are the point's components along the hand's orthonormal anatomical axes in hand lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and fixed geometry, then a turn reader; `across` lays a direction across the normal and `weights` takes axis components.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A direction too near the normal is replaced by the hand axis least along it, at the named provisional `ACROSS` share.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK and contact read serve every turn; a turn costs constant vector work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed geometry depends only on the body, the entry's holding, the prop and the row, which the search holds fixed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds constant-size hand-local geometry until released; each effector is fresh.
