# src/lexicon/admitCarExitSill.ts#admitCarExitSill

## @evidence contracts/development/common.md#meaningful-documentation

States the crossing rule, the three refusals and the returned crossings.

## @evidence contracts/development/implementation.md#principled-implementation

The crossing is the straight course's intersection with the opening's plane, by the signed outward distances of its ends; the width test doubles the farther crossing's lateral offset plus the clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved unchanged from HumanTravelCarExit, which keeps the turn and the rise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bound changed in the move; the clearance is the law's authored parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: two crossings and four signed distances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
