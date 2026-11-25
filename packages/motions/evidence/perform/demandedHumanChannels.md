# src/perform/demandedHumanChannels.ts#demandedHumanChannels

## @evidence contracts/development/common.md#meaningful-documentation

States which channels a bone set needs and why the read is exact for them.

## @evidence contracts/development/implementation.md#principled-implementation

A bone's frame depends only on its ancestors' joints; the channel partition follows the kinematic tree, so the root, the trunk, the bone's own channel and a digit's arm cover every ancestor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the bones and one ordered filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone is assumed independent of an ancestor; the root and the trunk are always demanded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the demanded bones, over nine channels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and returns a fresh array.
