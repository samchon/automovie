# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand

## @evidence contracts/development/common.md#meaningful-documentation

States the blend, both readings, the clock fields, the continuity at both seams with their sources and the difference from the column strip.

## @evidence contracts/development/design.md#principled-representation

One generating owner per seam: the band evaluates the host on the port curve and the part on its rail at every clock, with their own cross 2-jets, instead of interpolating sampled columns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input, the band with its correspondence, and one builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission refuses a non-monotone correspondence, a non-positive cross speed or a reading outside a side's domain; nothing is clamped or extrapolated past a domain.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.ISide

## @evidence contracts/development/design.md#principled-representation

The rail is the part's curve `u = rho(phi)` in its chart, the one its rail cycle reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only.

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the sign.

# src/construction/IAutoMovieConstructionPortBand.ts#IAutoMovieConstructionPortBand.IInput

## @evidence contracts/development/design.md#principled-representation

The column strip has already admitted the columns, their correspondence and their ribbon factors; this band joins those values round the loop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two sides, the port curve, the column data and the span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and indexing.
