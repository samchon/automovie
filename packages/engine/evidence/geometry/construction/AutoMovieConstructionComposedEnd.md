# src/geometry/construction/AutoMovieConstructionComposedEnd.ts#AutoMovieConstructionComposedEnd.create

## @evidence contracts/development/implementation.md#principled-implementation

Crossings of two closed curves solved on the curves with their own tangents; lobes are the arcs between a section's forks whose middle lies outside its neighbours; the seam plane is spanned by the forks' chord and the axes' bisector.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Polygons, crossings pair by pair, seams, then lobes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a wrong crossing count, an overlap of sections that are not neighbours, a crossing the iteration cannot settle and a bisector along the chord. Two crossings inside one pair of polygon edges are not seen at the given sample count.

## @evidence contracts/development/common.md#meaningful-documentation

States the search, the solve and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms `samples` readings per section, a quadratic edge test per pair of sections, and a few readings per fork.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each section's polygon serves every pair it belongs to and its lobes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The polygons are released; the result is caller-owned.

# src/geometry/construction/AutoMovieConstructionComposedEnd.ts#AutoMovieConstructionComposedEnd.section

## @evidence contracts/development/implementation.md#principled-implementation

The curve is the skin on the cut, its tangent the chain rule on the cut's slope; the axis is the mean unit station direction round the section, the axis itself on a straight part.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader and one average.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a section whose station directions cancel; nothing is fitted.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve, its tangent and the axis.

## @evidence contracts/development/implementation.md#efficient-algorithms `samples` skin jets for the axis; one cut reading and one jet per section reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader over the cut coordinates no further work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The section retains the skin and the cut.
