# src/geometry/curve/IAutoMovieMeasureCurveLength64.ts#IAutoMovieMeasureCurveLength64.IPieces

## @evidence contracts/development/common.md#meaningful-documentation

Each derivative piece has its own increasing parameter domain and world derivative in millimetres per that parameter unit. Piece domains need not share a clock; finite closed-domain derivatives and source chain-rule correctness remain caller premises checked only where sampled.

## @evidence contracts/development/design.md#principled-representation

Each derivative piece has its own increasing parameter domain and world derivative in millimetres per that parameter unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieCurveLength64 consumes the original derivative callbacks through the shared quadrature kernel.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Piece domains need not share a clock; finite closed-domain derivatives and source chain-rule correctness remain caller premises checked only where sampled.
