# src/physics/physicalRecoveryStepRecord.ts#physicalRecoveryStepRecord

## @evidence contracts/development/common.md#meaningful-documentation

States which record it finds and what it returns without one.

## @evidence contracts/development/implementation.md#principled-implementation

A limb's step under way is its latest unresolved record, since a limb has at most one step under way.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One backward scan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read indices inside the list's bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the records, from the latest, which is usually the first checked.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
