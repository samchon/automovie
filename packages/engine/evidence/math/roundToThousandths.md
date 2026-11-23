# src/math/roundToThousandths.ts#roundToThousandths

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing Math.round(value*1000)/1000 expression for representable scaled values. If finite input overflows that multiplication, its binary64 spacing already exceeds one thousandth, so returning the original value avoids inventing Infinity without losing representable decimal precision. Non-finite inputs keep their propagation and ordinary rounded outputs are unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quoting precision for message prose, imported by the film-grammar cut and pacing findings instead of each keeping a private `round`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no caller or quantity; it rounds every value by the same rule and is never used to decide a comparison.

## @evidence contracts/development/common.md#meaningful-documentation

States the precision, that the result is for prose rather than exact arithmetic, and the exact formula.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One multiply, one round and one divide, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing; it returns a number.
