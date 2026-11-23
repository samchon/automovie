# src/weapons/armourBone.ts#armourBone

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the side's default and which kinds read it, and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The bone whose segment the piece covers: the head, the chest, a hand, a lower arm, a lower leg.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per covered segment.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
