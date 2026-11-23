# src/math/bracketedRoot.ts#bracketedRoot

## @evidence contracts/development/common.md#meaningful-documentation

States the method and its source, why both ends close, the order of convergence, each parameter's unit and default, what is returned when the limit runs out or an end is a root, and every thrown input.

## @evidence contracts/development/implementation.md#principled-implementation

Dowell and Jarratt's Illinois rule: the chord's zero is evaluated, the half that keeps opposite signs is kept, and a value retained twice is halved, which removes false position's one-sided stall; the sign test keeps the root inside the bracket on every step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over a bracket of two arguments and their values, with one flag for the end kept last; callers pass only the function and the bracket.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bracket that does not straddle a root, a non-finite end or value and a non-positive tolerance are refused instead of answered with an end; no function or caller is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

One evaluation a step at superlinear order 1.44 on a smooth function, against bisection's one bit a step, bounded by `limit` evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments that evaluates each argument once and coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds five numbers and a flag for the duration of the call and retains nothing.
