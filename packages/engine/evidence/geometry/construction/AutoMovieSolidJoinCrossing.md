# src/geometry/construction/AutoMovieSolidJoinCrossing.ts#AutoMovieSolidJoinCrossing

## @evidence contracts/development/implementation.md#principled-implementation

Two segments cross properly when each one's ends lie strictly on opposite sides of the other's line, read by the oriented chart cross product; a rail offset past its radius of curvature crosses itself so.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pair scan with one orientation predicate, moved unchanged out of `AutoMovieSolidJoin`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance widens or narrows the strict test, and touching or overlapping edges are left to the later clip.

## @evidence contracts/development/common.md#meaningful-documentation

States the polygon, the closing edge, the result and what does not count.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n squared) orientation tests for n points, with the first crossing returned at once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scan of one polygon coordinates no repeated work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the points for the call and returns one string or null.
