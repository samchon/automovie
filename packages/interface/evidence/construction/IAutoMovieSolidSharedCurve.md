# src/construction/IAutoMovieSolidSharedCurve.ts#IAutoMovieSolidSharedCurve.Loop

## @evidence contracts/development/design.md#principled-representation

The chart curve with its 2-jet is what the host's map turns into the world curve's exact tangent and second derivative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One reader; `IAutoMovieConstructionPortCurve.ICurve.at` is one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The derivatives are the loop's own, never differences of its points.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the chart and the period.

# src/construction/IAutoMovieSolidSharedCurve.ts#IAutoMovieSolidSharedCurve.IInput

## @evidence contracts/development/design.md#principled-representation

The two surfaces, the loop on one face of the host, the kept side and the two limits a join already declares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the builder; none repeats another.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values and borrowed readers only.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and default.

# src/construction/IAutoMovieSolidSharedCurve.ts#IAutoMovieSolidSharedCurve.IShared

## @evidence contracts/development/design.md#principled-representation

The curve has the traced curve's own record, so rails, widths and the blend read it unchanged; the two readers carry what a tangential contact adds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A curve and two readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The arc of a point is read from the surfaces, never stored per clock.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning.

# src/construction/IAutoMovieSolidSharedCurve.ts#IAutoMovieSolidSharedCurve.IResult

## @evidence contracts/development/design.md#principled-representation

A nullable contact with its diagnostics, as a trace returns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A refusal carries no partial curve.

## @evidence contracts/development/common.md#meaningful-documentation

States the null and the diagnostics.
