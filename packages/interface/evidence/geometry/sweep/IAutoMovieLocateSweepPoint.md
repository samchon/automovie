# src/geometry/sweep/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IProps

## @evidence contracts/development/design.md#principled-representation

The point uses the compiled surface's model-metre frame; the locator checks finite coordinates and rejects parameter correspondence before querying polar radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

locateAutoMovieSweepPoint queries the canonical compiled surface's frame and radius, avoiding an independent geometry representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The common surface type permits parameter correspondence, so the locator explicitly refuses that unsupported domain instead of interpreting its curve parameter as polar angle.

## @evidence contracts/development/common.md#meaningful-documentation

States the required correspondence, finite-input check, model frame and endpoint projection behavior.

# src/geometry/sweep/IAutoMovieLocateSweepPoint.ts#IAutoMovieLocateSweepPoint.IResult

## @evidence contracts/development/design.md#principled-representation

u and v are dimensionless spine share and polar turns; offset is a signed radial length, not nearest-surface distance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The locator returns a new mutable record with only the chosen section, direction and signed radial residual.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite plane sampling and local bisection do not establish a global projection or a valid parameter-correspondence address.

## @evidence contracts/development/common.md#meaningful-documentation

Defines ranges, sign, units and sampled-root limitations of each result field.
