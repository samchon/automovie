# src/drawing/autoMovieDrawingCutEdges.ts#autoMovieDrawingCutEdges

## @evidence contracts/development/implementation.md#principled-implementation

Classifies each corner by its signed plane distance and interpolates linearly along each edge whose ends change sign, which is exact for a plane and a straight edge; a triangle with a corner strictly on each side always yields two crossing points, either two crossed edges or one crossed edge plus a corner within tolerance of the plane, so the first two hits form the segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function computes the section of a soup and delegates the distance to `autoMovieDrawingPlaneDistance`, the single definition the clip and the drafter also use.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No triangle or element is special-cased; coplanar and touching triangles are skipped by the stated tangency rule, not by a filter tuned to a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which triangles produce a segment and why tangent ones do not, that segments stay unjoined and undeduplicated, the plane definition and the output order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over `t` triangles with three distance evaluations each, linear time and at most `t` output segments; every triangle must be visited because any of them may straddle the plane.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per drawable per cut view, so nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array owned by the caller and keeps nothing after returning.
