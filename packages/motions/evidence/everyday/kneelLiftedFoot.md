# src/everyday/kneelLiftedFoot.ts#kneelLiftedFoot

## @evidence contracts/development/common.md#meaningful-documentation

States the limit, where the knee is read, the pivot and when nothing changes.

## @evidence contracts/development/implementation.md#principled-implementation

The knee is the closed-form two-link solution in the bend plane; the dorsiflexion is the shank's lean over the foot's own up axis in its forward plane; the turn is about the toes' joint with the toes extending by it, which keeps the toe segment and its pads in place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Knee, lean, excess, turn, then the ankle carried so the toes' joint stays.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The margin is named for the difference between this reading and the fitted joint's, not a looser limit; the toes never pass their range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is independent arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
