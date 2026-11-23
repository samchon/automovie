# src/sport/kickboxing/KickboxingRules.ts#KickboxingRules.foul

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the meaning of null.

## @evidence contracts/development/implementation.md#principled-implementation

Set membership of the struck region against the GLORY foul regions, and against the leg regions for a push kick.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Early returns for non-strikes and non-person targets, then two membership tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parameters arrive untyped from the schedule, so they are read through a narrowed view of the two fields the strikes declare; a strike without a person target is legal by construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
