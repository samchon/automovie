# src/posture/mirrorHumanLimbSource.ts#mirrorHumanLimbSource

## @evidence contracts/development/common.md#meaningful-documentation

States what the companion is for, why a reader per pose image helps, that frames never depend on it and the foreign-reader case.

## @evidence contracts/development/implementation.md#principled-implementation

A reader's cached rows are a function of the last pose it read; two images read alternately through one reader invalidate each other's rows, two readers keep their own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One weak lookup and, at first use, one fresh engine reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame, pose or fit is stored; the companion computes every frame from the pose it is given.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; a reader pair keeps both images' rows instead of recomputing them at every switch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The companion is keyed by the operation's own reader, so it lives exactly as long as the operation that made it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One companion per live engine reader, in a weak map released with the reader.
