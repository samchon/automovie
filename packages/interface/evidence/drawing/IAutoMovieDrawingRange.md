# src/drawing/IAutoMovieDrawingRange.ts#IAutoMovieDrawingRange.IResult

## @evidence contracts/development/design.md#principled-representation

Two numbers carry comparison extrema in the input's unit; min <= max is conditional on at least one non-NaN input and is deliberately not a type invariant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Drawing depth bands, world extents and schedule section minima share this unscaled fold; their distinct physical meanings stay at their callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty/all-NaN inputs retain mathematical fold identities instead of fabricating zero dimensions, and infinities are not silently rejected or clamped.

## @evidence contracts/development/common.md#meaningful-documentation

Defines empty/all-NaN behavior, units, infinities, absent rounding and caller-owned result mutability.
