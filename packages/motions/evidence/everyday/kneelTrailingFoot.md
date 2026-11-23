# src/everyday/kneelTrailingFoot.ts#kneelTrailingFoot

## @evidence contracts/development/common.md#meaningful-documentation

States when the foot stays flat, the rise, the pivot and where the knee is read.

## @evidence contracts/development/implementation.md#principled-implementation

The closed-form two-bone knee in the plane of the hip, the ankle and the pole; the ankle's flexion is the shank's lean over the foot's own up axis; the rise is the least one within the range, found by bisection since the flexion falls as the heel rises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The flexion of a rise, the flat test, one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ranges are the range table's; a flat foot within its range is returned unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One flexion read for a foot within range, seventeen otherwise.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs, read once per key.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
