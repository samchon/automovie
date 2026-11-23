# src/drawing/IAutoMovieDrawingRange.ts#IAutoMovieDrawingRange

## @evidence contracts/development/design.md#principled-representation

IResult preserves input units and comparison extrema, including inverted empty/all-NaN identities; it asserts no finite-range invariant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Drawing bounds, depth classification and schedule minima use this common fold result while retaining physical semantics at their callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No special empty-input zero or finite-value clamp hides missing measurements.

## @evidence contracts/development/common.md#meaningful-documentation

IResult documents sentinel values, infinities, NaN handling and absent rounding.

# src/drawing/IAutoMovieDrawingRange.ts#IAutoMovieDrawingRange.IResult

## @evidence contracts/development/design.md#principled-representation

Two numbers carry comparison extrema in the input's unit; min <= max is conditional on at least one non-NaN input and is deliberately not a type invariant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Drawing depth bands, world extents and schedule section minima share this unscaled fold; their distinct physical meanings stay at their callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty/all-NaN inputs retain mathematical fold identities instead of fabricating zero dimensions, and infinities are not silently rejected or clamped.

## @evidence contracts/development/common.md#meaningful-documentation

Defines empty/all-NaN behavior, units, infinities, absent rounding and caller-owned result mutability.
