# src/lexicon/HumanMountedStride.ts#HumanMountedStride.level

## @evidence contracts/development/common.md#meaningful-documentation

States the average and its window.

## @evidence contracts/development/implementation.md#principled-implementation

The mean of `SAMPLES` equally spaced readings over one period removes every harmonic of the period below the sample count, so the back's periodic rise and fall leaves the point while the course's steady travel stays.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Readings outside the carrier's motion are its own held ends.

## @evidence contracts/development/implementation.md#efficient-algorithms `SAMPLES` carrier readings per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedStride.ts#HumanMountedStride.along

## @evidence contracts/development/common.md#meaningful-documentation

States the movement and its sign.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

One translation along the grip's own line.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip without an axis, or no distance, is left where it is.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedStride.ts#HumanMountedStride.push

## @evidence contracts/development/common.md#meaningful-documentation

States the movement and its period.

## @evidence contracts/development/implementation.md#principled-implementation

A sine of the stride's phase along the grip's axis, the rein's own line, so the hand stays on the rein.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip without an axis is left where it is.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
