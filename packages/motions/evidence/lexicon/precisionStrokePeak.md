# src/lexicon/precisionStrokePeak.ts#precisionStrokePeak

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, over which path, its unit and the case of no goal.

## @evidence contracts/development/implementation.md#principled-implementation

The pace is the law's own: the hand goal's speed along the path the stroke writes, the swing composed with the body's turn and address, which no closed form of the swing alone gives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the stroke at a fixed step, keeping the previous point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant is added to the speed read; a goal absent at an instant breaks no difference across it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stroke's seconds at 240 Hz; the posture writes goals without solving the limbs, and the caller reads it once per stroke.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of the posture handed in.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one point while it reads and nothing after it returns.
