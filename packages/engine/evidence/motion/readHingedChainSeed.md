# src/motion/readHingedChainSeed.ts#readHingedChainSeed

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the branch, swivel and twist readings and the null cases.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of fitHingedChainAt's pose: the joints composed through the same clinical bases, the branch by the least angle between hinge articulations, the swivel by the chain's own reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareHingedChainAt owns the preparation; this composes, picks the branch and reads the swivel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No search; a degenerate chain declines.

## @evidence contracts/development/implementation.md#efficient-algorithms

One preparation, two compositions, at most two branch poses and one swivel reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
