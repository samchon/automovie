# src/motion/hingedChainSide.ts#hingedChainSide.bound

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the bound and the straight case.

## @evidence contracts/development/implementation.md#principled-implementation

The sinusoid's greatest cosine over an interval is 1 when the interval holds the phase, else the larger end cosine; the bound is lowered by ROUNDING below every candidate it bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One circle reading, then a closure per interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A straight limb bounds nothing rather than guessing a side.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two offsets once, then constant work per interval.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The closure keeps three scalars.

# src/motion/hingedChainSide.ts#hingedChainSide.peak

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the range and the straight case.

## @evidence contracts/development/implementation.md#principled-implementation `R cos(s - p)` is greatest at `s = p = atan2(b, a)`, with `a` and `b` the side's dots with the unit offsets at 0 and 90 degrees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One circle reading and one wrap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A straight limb returns null so its caller's general search decides.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two offsets and constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
