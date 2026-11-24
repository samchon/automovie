# src/posture/mirrorHumanLimbSource.ts#mirrorHumanLimbSource

## @evidence contracts/development/common.md#meaningful-documentation

States what the mirror image's reader is for, why a reader per pose image helps, that frames never depend on it and the foreign-reader case.

## @evidence contracts/development/implementation.md#principled-implementation

A reader's rows are a function of the last pose it read; two images read alternately through one reader invalidate each other's rows, two readers keep their own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One engine check and one fresh engine reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame, pose or fit is stored; the reader computes every frame from the pose it is given.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; the mirror image's reader keeps its rows for the solve instead of recomputing them at every switch.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call makes its own reader; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the reader is released with the solve that holds it.
