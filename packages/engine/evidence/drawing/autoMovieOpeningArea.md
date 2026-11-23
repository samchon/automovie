# src/drawing/autoMovieOpeningArea.ts#autoMovieOpeningArea

## @evidence contracts/development/implementation.md#principled-implementation

The shoelace area of the straight outline plus the signed circular-segment area of each bulged edge, which is exact for a simple outline whose arcs cross no other edge, the outline validation accepts; the segment's sign follows the sweep, so an arc bulging inward subtracts and one bulging outward adds whichever way the outline winds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the opening area for the take-off, reusing `polygonDoubleArea` for the straight part and `autoMovieOpeningArc` for each edge's circle, so the area and the drafted outline read one arc convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening shape is special-cased, and the hull the wall kernel cuts is deliberately not used because it measures a different quantity.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the unit and rounding, why the exact area is used instead of the hull, the segment formula, the winding independence and the validated-outline premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `n` outline edges plus the shoelace pass, linear time and constant extra space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per opening per quantity report; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one small arc record per bulged edge and retains nothing.
