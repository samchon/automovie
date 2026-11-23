# src/motion/hingedTwistStart.ts#hingedTwistStart

## @evidence contracts/development/common.md#meaningful-documentation

States the harmonic premise, the swing-twist reading, the derivation, the frames and that the result is a start, not a certified minimum.

## @evidence contracts/development/implementation.md#principled-implementation

The half-angle law of the swivel rotation (Tolani, Goswami and Badler 2000) makes the remaining rotation a first harmonic of the half swivel; the swing-twist decomposition gives the wrist's share as the swing from the forearm's axis; a quadratic form on the unit circle is greatest along its principal axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two poser readings, four scalar coefficients, one two-by-two form and one atan2.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns null rather than an arbitrary swivel when nothing is preferred; the caller's acceptance, not this start, certifies the rotation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: two poses, a handful of quaternion products, no score.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
