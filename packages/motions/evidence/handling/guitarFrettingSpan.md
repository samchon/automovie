# src/handling/guitarFrettingSpan.ts#guitarFrettingSpan

## @evidence contracts/development/common.md#meaningful-documentation

Gives the measured chains, units and meaning of the bound.

## @evidence contracts/development/implementation.md#principled-implementation

Adds the knuckle separation and both articulated chain lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two chains are read with their distal fingertip offsets in one traversal each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound uses the performer's own bones and surfaces. A point inside the bound still needs a joint fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work over two three-bone chains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the posed entry bones already needed for both arm goals.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no pose.
