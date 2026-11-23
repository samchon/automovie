# src/math/bracketedBisection.ts#bracketedBisection

## @evidence contracts/development/common.md#meaningful-documentation

States the method, which end each argument is, why the ends are not read, when to prefer the bracketed root, the unit of the tolerance, which end is returned and every thrown input.

## @evidence contracts/development/implementation.md#principled-implementation

Bisection: the midpoint is read and the half whose ends disagree is kept, which needs nothing of the condition but that it holds at one end and not at the other, and keeps the boundary inside the bracket on every step. It ends at the requested width or at two adjacent doubles, where the midpoint equals an end (the machine-resolution stop of a floating-point bisection); a sum of ends that overflows is replaced by the sum of their halves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over two ends; callers pass only the condition, the bracket and the tolerance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-finite end and a non-positive tolerance are refused instead of answered with an end; no condition or caller is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

One evaluation a step, ceil(log2(|high - low| / tolerance)) in all, the fewest any search that reads only a yes or a no can take; the ends are not read again. A midpoint that rounds onto an end stops the search (the bracket holds no double between its ends), so the count is also at most log2 of the widest finite bracket over the least spacing of doubles, log2(2^1025 / 2^-1074) = 2099, whatever the tolerance.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments that evaluates each midpoint once and coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds two numbers for the duration of the call and retains nothing.
