# src/motion/carriedRate.ts#carriedRate

## @evidence contracts/development/implementation.md#principled-implementation

The quintic Hermite basis function of a unit initial first derivative, fixed by zero value and acceleration at both ends, unit slope at the start and zero at the end; scaling by the duration maps the unit interval to seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed-form polynomial in the normalized time; the caller multiplies by its own entry rate, so the term carries no state and no unit of the path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The elapsed time is clamped into the duration because the basis is defined there and zero at both ends, so the clamp changes no value; a non-positive or non-finite duration is refused instead of answered with zero.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Seven multiplications in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two numbers that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result is a local number.

## @evidence contracts/development/common.md#meaningful-documentation

States the break the term mends, the polynomial and its six end conditions, the peak and the room it bounds, how it differs from `inertializeOffset` and when to use which, the units, the clamp and the thrown inputs.
