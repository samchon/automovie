# src/posture/HumanArmPartScreen.ts#HumanArmPartScreen

## @evidence contracts/development/common.md#meaningful-documentation

States what is screened, why, the source and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A sphere bounding a part's probes lies no nearer a shape than any of them, so a shape beyond the part's sphere by the reach is beyond every probe of it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Group the probes by part, bound each group, filter its segment's screen.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only shapes surely out of reach are left out; every probe's own sphere screen and exact distance stay the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the probes, then parts times screened shapes, where the probes times screened shapes the segment screen left were read before.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh lists and retains nothing.
