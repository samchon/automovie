# src/motion/smoothMinimum.ts#smoothMinimum

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, where it equals the plain minimum, its largest departure and where, the continuity it gives, the maximum by negation, the width's unit and the thrown inputs.

## @evidence contracts/development/implementation.md#principled-implementation

The quadratic polynomial smooth minimum: the blend weight is linear in the gap and vanishes at the width, so the correction and its first derivative are zero where the plain minimum takes over and the result is once continuously differentiable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two lines, the blend weight and the corrected minimum; the maximum is this function on negated arguments, so no second rule exists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-finite value and a non-positive width are refused instead of falling back to the plain minimum; the width is the caller's stated unit, never a constant tuned here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A handful of arithmetic operations in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of three numbers that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result is a local number.
