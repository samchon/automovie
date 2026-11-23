# src/geometry/measureAutoMovieProjectionIntervals.ts#measureAutoMovieProjectionIntervals

## @evidence contracts/development/implementation.md#principled-implementation

Interval arithmetic with directed one-ulp widening: each rounded difference, product and sum is replaced by its adjacent binary64 neighbours, which bracket the exact value under round-to-nearest, and the norm is raised until its rounded-down square covers the rounded-up squared norm, so every true projection lies in its interval and the true norm never exceeds `normUpper`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of enclosed projection arithmetic for `boundAutoMovieProjectionSeparation` and `boundAutoMovieTriangleAttachmentContact`, which only compare interval ends and divide by the norm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No spatial tolerance widens an interval; the only widening is the adjacent-float step after each rounded operation, and overflow refuses instead of returning an infinite interval.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the direction scaling and why rounding of the proposal is harmless, what the norm enclosure is for, the zero-direction result, the default origin, every refusal and the consumers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the point count n: one finiteness pass and, per point, at most three axis terms of a few adjacent-float steps each, allocating only the n result tuples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; each separation or contact bound asks for one direction once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned tuples and a number and keeps no reference to the inputs; the shared adjacent-float buffer is answered on its owner.
