# src/film/propBoundsOverlap.ts#propBoundsOverlap

## @evidence contracts/development/implementation.md#principled-implementation

The strict interval separating-axis test gives positive-volume interior overlap for ordered positive-size boxes. Its explicit degenerate-box policy also reports a flat plane strictly inside another box; touching the other's boundary fails, so this is not a claim that a zero-volume box has nonempty three-dimensional interior.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One intrusion test shared by prop placement, building placement overlap and service-network clash checks, so every gate agrees on what touching means.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance is added for any caller; contact is excluded by the comparison itself, not by a tuned gap.

## @evidence contracts/development/common.md#meaningful-documentation

States the contact rule and why, how a flat box behaves, the `NaN` answer, who relies on it, and the frame and unit of both boxes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: at most six comparisons, short-circuiting on the first separating axis.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over two boxes that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads six coordinates of each box by value; it allocates nothing and holds no reference past the call.
