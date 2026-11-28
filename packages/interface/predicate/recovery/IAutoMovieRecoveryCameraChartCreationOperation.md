# src/recovery/IAutoMovieRecoveryCameraChartCreationOperation.ts#IAutoMovieRecoveryCameraChartCreationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation identifies forward and inverse matrix conventions and the arithmetic gate for the resident pixel chart.

## @evidence contracts/development/design.md#principled-representation

An upper-triangular K provides an analytic inverse. Calibration must preserve distinguishable one-pixel movements, including under a large principal offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies the intrinsic values. This operation prepares the fixed chart for later normalization and projection.
