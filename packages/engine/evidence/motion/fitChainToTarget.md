# src/motion/fitChainToTarget.ts#fitChainToTarget

## @evidence contracts/development/implementation.md#principled-implementation

The pose `fitSeededChainToTarget` fits, unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call; the search lives in `fitSeededChainToTarget`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: nothing is computed here.

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and whose fit it is.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One call, the cost `fitSeededChainToTarget` states.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `fitSeededChainToTarget` whole.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
