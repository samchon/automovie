# src/physics/retimePhysicalRecoveryStep.ts#retimePhysicalRecoveryStep

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, what is kept and that the input is unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

The start moves to the given moment and the end with it, the duration kept: a request is timed from now until it lifts and from its lift-off then.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
