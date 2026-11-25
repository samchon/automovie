# src/geometry/IAutoMoviePlanSupportLoft64.ts#IAutoMoviePlanSupportLoft64.IInput

## @evidence contracts/development/design.md#principled-representation

Loft stations, offsets and chord tolerance use local metres; the direction-sine threshold is dimensionless and budgets count events and strips.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieSupportLoft64 receives admitted fields from realizeAutoMovieConvexSupportLoft and supplies emitAutoMovieSupportLoft64.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller admits fields and budget ranges; planning refuses exhausted budgets, weak sections and unresolved numerical events without certifying root intervals.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs for planning incidence events and ruled strips of a cubic support loft. Loft stations, offsets and chord tolerance use local metres; the direction-sine threshold is dimensionless and budgets count events and strips.
