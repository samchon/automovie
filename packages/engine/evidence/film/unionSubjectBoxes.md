# src/film/unionSubjectBoxes.ts#unionSubjectBoxes

## @evidence contracts/development/implementation.md#principled-implementation

The union of axis-aligned boxes is the per-axis minimum of the minimum corners and maximum of the maximum corners, computed by a left fold whose `Math.min` and `Math.max` are exact, so the order of the boxes does not change the result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fold over the list with no options; the empty case answers null so a caller distinguishes "no subject" from a real point box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Treats every box alike and caps no input size; the argument-count limit of a spread call is removed by folding, not caught and retried.

## @evidence contracts/development/common.md#meaningful-documentation

States the null for an empty list, that any list length is accepted, the `NaN` propagation, and that the result is a new box leaving the inputs untouched.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `n` boxes, `O(n)` time with constant extra space beyond the returned box, and no intermediate per-axis arrays; callers such as building content bounds pass every placed part box, so the pass must not allocate per box.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure fold over the given list that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the one returned box.
