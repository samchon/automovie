# src/daily/handToFaceMirrored.ts#handToFaceMirrored

## @evidence contracts/development/common.md#meaningful-documentation

States the mirroring rule.

## @evidence contracts/development/implementation.md#principled-implementation

Paired regions carry their side in the name, so mirroring swaps the suffix; a midline region is its own mirror.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional chain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the trailing side is swapped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
