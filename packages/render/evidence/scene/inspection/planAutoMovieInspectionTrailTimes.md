# src/index.ts#planAutoMovieInspectionTrailTimes

## @evidence contracts/development/common.md#meaningful-documentation

States the grid, why it passes through the drawn second, the clipping, the order, how a host uses the times, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each time is the drawn second plus an integer multiple of `1 / ticks`, computed from the integer rather than accumulated, so the grid has no drift and the drawn second is exact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, then one loop over the integer offsets within the reach.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window is the request's stated reach and rate, and a time outside the subject is dropped rather than clamped onto its ends, which would sample one place twice.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the times returned, `2 reach ticks + 1` at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and keeps nothing.
