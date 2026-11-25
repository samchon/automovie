# src/everyday/addHumanTrunkInclination.ts#addHumanTrunkInclination

## @evidence contracts/development/common.md#meaningful-documentation

States the written joint, the share and the flexion's unit, and that the other two angles are kept.

## @evidence contracts/development/implementation.md#principled-implementation

Adds the bone's share of the spinal inclination to its clinical flexion, the lumbopelvic rhythm's split that `HumanTrunk.incline` computes; a bone without a record starts at zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `HumanTrunk` unchanged; `HumanTrunk.incline` writes the spine and the chest through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The share is the caller's rhythm; nothing is tuned here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time, one tuple.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Writes into the caller's record and retains nothing.
