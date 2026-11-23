# src/autoMovieSubjectPlacedBounds.ts#autoMovieSubjectPlacedBounds

## @evidence contracts/development/implementation.md#principled-implementation

Places each vertex with the same column-major TRS matrix the renderer composes, so the box is exactly the axis-aligned bounds of the drawn vertices rather than a transformed local box, which would overestimate under rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placed-bounds rule for element, element-part and instance descriptions, which previously each built a transformed point array and then a box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject or transform is special-cased; an empty point list is null rather than a fabricated box.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the composition order, that no copy is built, the units, the empty case, and that the result is new.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the n points, O(n) time and O(1) extra space beyond one placed point at a time, replacing a mapped copy of every placed point.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure measurement of one point list under one transform; the subject describer shares the model-frame points across placements.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the matrix, one placed point per step and the returned box, and retains nothing.
