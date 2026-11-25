# src/posture/HumanTrunkTurn.ts#HumanTrunkTurn.turned

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their units and what is set.

## @evidence contracts/development/implementation.md#principled-implementation

Each freedom moves the share of the way to its own range's end toward the side, so the turn never leaves the range; the head's take-back is clamped to the neck's and the head's ranges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two loops: the trunk turns, the head rights.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint without a range in a freedom is left as it is in it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: four joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new posture and retains nothing.
