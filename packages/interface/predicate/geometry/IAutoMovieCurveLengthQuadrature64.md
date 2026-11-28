# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult

## @evidence contracts/development/common.md#meaningful-documentation

The record specifies K and 2K integrals, diagnostic flags and separate endpoint behavior for the two length readers.

## @evidence contracts/development/design.md#principled-representation

The kernel reads requested endpoints and interior nodes, integrates original speed and records arithmetic observations separately from public admission. It detects nonfinite derivatives and contributions, including NaN. The strict one-panel reader performs both endpoint observations before its 24 interior observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The output carries sums and diagnostic flags. Public readers choose admission policy and retain responsibility for their callbacks.

# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult.coarseMm

## @evidence contracts/development/common.md#meaningful-documentation

The value represents the K-panel computed sum in millimetres.

# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult.fineMm

## @evidence contracts/development/common.md#meaningful-documentation

The value represents the 2K-panel computed sum in millimetres.

# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult.nonfiniteDerivative

## @evidence contracts/development/common.md#meaningful-documentation

The flag reports malformed or nonfinite requested XYZ derivative observations, or a nonfinite speed norm.

# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult.underflowingContribution

## @evidence contracts/development/common.md#meaningful-documentation

The flag identifies a positive speed with a zero weighted contribution.

# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult.nonfiniteContribution

## @evidence contracts/development/common.md#meaningful-documentation

The flag reports a nonfinite weighted node contribution, including NaN.

# src/geometry/IAutoMovieCurveLengthQuadrature64.ts#IAutoMovieCurveLengthQuadrature64.IMeasureResult.collapsedNode

## @evidence contracts/development/common.md#meaningful-documentation

The flag reports a mapped node outside the open interval of its panel.
