# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The curve describes its piecewise millimetre field, independent piece degrees, declared phase chart and closure metadata.

## @evidence contracts/development/design.md#principled-representation

The full curve validator requires a nonblank name and a dense matching phase partition with increasing finite cumulative widths, then checks each piece's coefficient population and denominator. The evaluator reads each piece in its own normalized local chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The outer primitive owns identity and phase widths. The individual piece contracts own their polynomial or rational data.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.type

## @evidence contracts/development/common.md#meaningful-documentation

The literal selects the Bernstein coefficient path in curve validation and evaluation.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.name

## @evidence contracts/development/common.md#meaningful-documentation

The nonblank authored identity remains available for source attribution and inspection.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.closed

## @evidence contracts/development/common.md#meaningful-documentation

The flag records authored closure while separate operations evaluate continuity and regularity.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.unit

## @evidence contracts/development/common.md#meaningful-documentation

The literal millimetre unit is required at the coefficient boundary.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.phaseUnit

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the independent parameter unit shared by the partition and output derivative.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.phaseIntervals

## @evidence contracts/development/common.md#meaningful-documentation

Each piece contributes one positive finite phase width. Cumulative sums advance strictly and address seams.

# src/geometry/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64.pieces

## @evidence contracts/development/common.md#meaningful-documentation

The ordered array uses each piece's actual degree and coefficient representation, including its denominator authority for rational pieces.
