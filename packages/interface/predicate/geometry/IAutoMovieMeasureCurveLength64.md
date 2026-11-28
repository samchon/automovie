# src/geometry/IAutoMovieMeasureCurveLength64.ts#IAutoMovieMeasureCurveLength64.IPieces

## @evidence contracts/development/common.md#meaningful-documentation

The list describes the original world derivatives, per-piece parameter domains and units, and the limits of the two quadrature observations.

## @evidence contracts/development/design.md#principled-representation

The owner integrates the norm of each supplied derivative on its own increasing domain. World-frame continuity and derivative correctness remain the caller's premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The list borrows original source callbacks from independent charts and returns measured lengths under a separate result contract.

# src/geometry/IAutoMovieMeasureCurveLength64.ts#IAutoMovieMeasureCurveLength64.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

The record describes the derivative's own parameter domain and physical units delta-position per parameter unit.

## @evidence contracts/development/design.md#principled-representation

The length operation pairs each derivative with its bounds when checking finite endpoints and placing the composite quadrature nodes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only bounds and first derivative are required. Original curve representation, feature identity and any error certificate remain outside the piece.

# src/geometry/IAutoMovieMeasureCurveLength64.ts#IAutoMovieMeasureCurveLength64.IPiece.domain

## @evidence contracts/development/common.md#meaningful-documentation

The bounds are finite and increasing in the derivative's parameter chart.

# src/geometry/IAutoMovieMeasureCurveLength64.ts#IAutoMovieMeasureCurveLength64.IPiece.derivative

## @evidence contracts/development/common.md#meaningful-documentation

The callback produces the original world derivative in millimetres per parameter unit.
