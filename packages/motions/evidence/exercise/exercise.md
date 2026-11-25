# src/exercise/exercise.ts#exercise.drop

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The standing leg's length less the hip's height over the ankle with the thigh at its angle and the shank leaning at most `SHANK`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two angles and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shank's lean is clamped at the named limit, so the hips move back rather than the ankle overflexing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
