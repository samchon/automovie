# src/motion/carriedAcceleration.ts#carriedAcceleration

## @evidence contracts/development/implementation.md#principled-implementation

The quintic Hermite basis function of a unit initial second derivative, fixed by zero value and slope at both ends, unit acceleration at the start and zero at the end; scaling by the squared duration maps the unit interval to seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed-form polynomial in the normalized time; the caller multiplies by its own acceleration, so the term carries no state and no unit of the path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The elapsed time is clamped into the duration because the basis is defined there and zero at both ends, so the clamp changes no value; a non-positive or non-finite duration is refused instead of answered with zero.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Six multiplications in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two numbers that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result is a local number.

## @evidence contracts/development/common.md#meaningful-documentation

States the polynomial and its six end conditions, how it completes the quintic with `carriedRate`, the backward reading and its sign, the peak, the units, the clamp and the thrown inputs.
