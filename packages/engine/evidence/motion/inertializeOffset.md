# src/motion/inertializeOffset.ts#inertializeOffset

## @evidence contracts/development/common.md#meaningful-documentation

Cites the method, derives the factored quintic and the clamp, states the continuity and overshoot guarantees and why a finite quintic is used.

## @evidence contracts/development/implementation.md#principled-implementation

Bollo's quintic inertialization with its overshoot clamp, written in the factored form whose sign condition is the clamp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clamp, then two polynomials.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-finite inputs and a non-positive duration throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one small record.
