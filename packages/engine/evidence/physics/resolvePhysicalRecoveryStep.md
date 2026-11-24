# src/physics/resolvePhysicalRecoveryStep.ts#resolvePhysicalRecoveryStep

## @evidence contracts/development/common.md#meaningful-documentation

States which record is resolved, with what, and what it returns without one.

## @evidence contracts/development/implementation.md#principled-implementation

The limb's step under way (`physicalRecoveryStepRecord`) is marked with when and how it ended, kept for replay, audio and support audits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one copy of the list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
