# src/executable/cases/MotionPlaceVerdicts.ts#MotionPlaceVerdicts.at

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the pass rule and what the detail reports.

## @evidence contracts/development/implementation.md#principled-implementation

Passes when the nearest height, lateral and distance names equal the expected ones; the offset is measured from the expected place in the performer's floor frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One nearest-name read, one resolved place and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance is typed: the names' own midpoints are the bounds.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `nearest`, `place`, `fallback` and `HumanFrame.local`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
