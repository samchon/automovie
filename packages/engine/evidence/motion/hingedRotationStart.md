# src/motion/hingedRotationStart.ts#hingedRotationStart

## @evidence contracts/development/common.md#meaningful-documentation

States the harmonic premise, the derivation, the frames and that the result is a start, not a certified minimum.

## @evidence contracts/development/implementation.md#principled-implementation

The half-angle law of the swivel rotation (Tolani, Goswami and Badler 2000, the swivel as a rotation about the root-to-target axis) and the linearity of conjugation make the required articulation a first harmonic of the half swivel; the angle from identity is the arccosine of its scalar part's magnitude, maximised in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two poser readings, two quaternion products each and one atan2.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns null rather than an arbitrary swivel when no direction is preferred; the caller's acceptance, not this start, certifies the rotation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: two poses, a handful of quaternion products, no score.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
