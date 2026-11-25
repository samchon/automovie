# src/motion/steerAutoMovieCrowdNeighbours.ts#steerAutoMovieCrowdNeighbours

## @evidence contracts/development/implementation.md#principled-implementation

Two points within one cell side of each other differ by at most one in each cell coordinate, so the 3 x 3 block around a cell holds every agent within `cell` of any point in it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass buckets the agents; a query reads nine buckets into the caller's buffer and sorts it in place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns candidates only; the caller still applies its own exact distance tests, and ascending order keeps every sum the caller forms in the order of a full scan.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) to bucket N agents; a query costs its nine buckets' size m and O(m log m) to order them, in place of a scan of all N.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One evaluation's state; the next evaluation's positions differ.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The buckets hold N indices and live as long as the caller keeps the query, one evaluation.

## @evidence contracts/development/common.md#meaningful-documentation

States the state layout, the cell, the guarantee and the order of a query's result.
