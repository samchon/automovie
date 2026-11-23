# src/animals/QuadrupedGaitAdmission.ts#QuadrupedGaitAdmission.elevation

## @evidence contracts/development/common.md#meaningful-documentation

States the range and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The coordinates run along the cannon from the fetlock to the carpus or hock, so only zero to one names a point on it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check both ends, return a copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small copy.

# src/animals/QuadrupedGaitAdmission.ts#QuadrupedGaitAdmission.collected

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the copy and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A collected gait is entered by slowing out of an automatic gait (`QuadrupedRideClock.collectedSpeed`), so its parent must be one the ride can select by speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An invalid entry refuses rather than being dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the entries and the gait lists.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the gait lists the table admission already built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small copy.
