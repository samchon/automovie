# src/recovery/IAutoMovieRecoveryCameraPointTriangulationOperation.ts#IAutoMovieRecoveryCameraPointTriangulationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation names the borrowed charts and pose, the numerical limits, the source-coordinate point and its signed depth and original-chart residual diagnostics.

## @evidence contracts/development/design.md#principled-representation

Inverse intrinsics supply the two rays. The smallest design direction provides the homogeneous point after the third singular direction passes its threshold. Ray angle is measured in the first camera chart before solving for depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Triangulation owns algebraic point and projection diagnostics. Relative pose selection and map growth apply their own depth, residual and support policies.
