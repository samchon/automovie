# src/math/nearestAngleAlias.ts#nearestAngleAlias

## @evidence contracts/development/common.md#meaningful-documentation

States the alias chosen, the tie, the immobile case, that nothing is clamped and why the nearest alias matters.

## @evidence contracts/development/implementation.md#principled-implementation

The aliases inside an interval are the whole turns between its ends, so the least and the greatest are two roundings; with none inside, the two neighbours of the interval are compared by their overshoot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two roundings and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angle is only shifted by whole turns, never moved into the interval.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one alias owner, read by the joint inverse's chart choice and by the swing-twist range's twist.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
