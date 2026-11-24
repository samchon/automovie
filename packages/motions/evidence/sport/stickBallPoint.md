# src/sport/stickBallPoint.ts#stickBallPoint

## @evidence contracts/development/common.md#meaningful-documentation

States what it finds and when it refuses.

## @evidence contracts/development/implementation.md#principled-implementation

A linear lookup of the prop's declared affordances by id, the archetype's own declaration being the only source of its working points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: resolving a stick's or ball's named working point, apart from the stroke that uses it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing point is refused with the affordance named; no default point stands in.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(a) over the prop's a affordances, at plan time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the prop's declaration directly; there is no equivalent work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the prop's own affordance record; it retains nothing.
