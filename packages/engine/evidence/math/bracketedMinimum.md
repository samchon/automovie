# src/math/bracketedMinimum.ts#bracketedMinimum

## @evidence contracts/development/common.md#meaningful-documentation

States the method and its source, when the parabola is taken, what the bracket guarantees, each parameter's unit, what is returned and what is refused.

## @evidence contracts/development/implementation.md#principled-implementation

Brent's `localmin`: successive parabolic interpolation safeguarded by golden section, with his acceptance tests and his tolerance of the square root of the machine precision times the argument plus the absolute one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the bracket and the three best points, as the source states it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-finite ends and a non-positive tolerance are refused; a parabola that would leave the bracket or stall is not taken.

## @evidence contracts/development/implementation.md#efficient-algorithms

One evaluation a step, superlinear on a smooth function against golden section's fixed ratio of 0.618 a step, bounded by `limit`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments that evaluates each argument once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds a dozen numbers for the call and retains nothing.
