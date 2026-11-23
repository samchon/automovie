# src/posture/isHumanArmAlone.ts#isHumanArmAlone

## @evidence contracts/development/common.md#meaningful-documentation

States the condition, why it makes the arm's fit independent of the rest and what a caller does with it.

## @evidence contracts/development/implementation.md#principled-implementation

The two ways another limb's fit couples with this arm's: an arm fitted with it (the pair) and a goal attached to one of its bones; both are read off the goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test of the other arm and one scan of the two legs' attachments.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bone names tested are the arm chain's and its hand's digits, by side; no law or body is named. Digit goals are not read: a caller that reads the fitted digits, not the arm alone, solves the posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one statement of the condition, shared by the drinking arm's search and the hand-to-face law's reach time.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
