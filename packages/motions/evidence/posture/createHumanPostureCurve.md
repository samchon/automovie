# src/posture/createHumanPostureCurve.ts#createHumanPostureCurve

## @evidence contracts/development/common.md#meaningful-documentation

States the copy and the fresh read.

## @evidence contracts/development/implementation.md#principled-implementation

A constant curve holds one copy of its posture and returns a fresh copy at every second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy, one reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No read shares a record with the input or another read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One copy per read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader owns its one copy and is released with its plan.
