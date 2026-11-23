# src/drawing/IAutoMovieDrawingDimension.ts#IAutoMovieDrawingDimension

## @evidence contracts/development/design.md#principled-representation

Both ends go through `resolveAutoMovieDrawingFeature`; a `page` value is the Euclidean distance between the two rounded page points, a `world` value the length of the difference of the unrounded world points, and either is rounded to six decimals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record copies the spec's id and measure and adds outcome, endpoints and value, so the serializer draws the line and the reader checks the number without the view.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One stale end makes the whole dimension stale with no partial geometry, rather than drawing half a dimension or reusing a previous value.

## @evidence contracts/development/common.md#meaningful-documentation

States when the record is stale and which reason it carries, the units and rounding of points and value, what each measure computes, and when each member is null.
