# src/lexicon/HumanWeaponTrack.ts#HumanWeaponTrack.path

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The rotation is the one about the axis square to both sight lines by the angle between them, applied to the hand's point about the eye and to the hand's rotation; below a thousandth of a degree the pose is returned as it is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cross product, one angle, one rotated frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The target is read at the second shown, never extrapolated; the limits are stated on the namespace.

## @evidence contracts/development/implementation.md#efficient-algorithms

One target read and constant arithmetic per evaluated second.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Postures are evaluated independently; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The path closes over the pose, the eye and the context.
