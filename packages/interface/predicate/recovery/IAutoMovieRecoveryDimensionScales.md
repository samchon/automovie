# src/recovery/IAutoMovieRecoveryDimensionScales.ts#IAutoMovieRecoveryDimensionScales

## @evidence contracts/development/common.md#meaningful-documentation

Each scale specifies its accepted range and physical anchor. Unit factors preserve the fit's original dimensions.

## @evidence contracts/development/design.md#principled-representation

Elliptic radii and centers scale along their own axes. Convex-support normals and offsets use the equivalent transformed half-plane equations, and both lofts share the same first-station Y anchor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The recipes retain the edits. Each compiler applies them to fresh coefficients and passes the separately supplied tolerance and limits to Engine.

# src/recovery/IAutoMovieRecoveryDimensionScales.ts#IAutoMovieRecoveryDimensionScales.widthScale

## @evidence contracts/development/common.md#meaningful-documentation

The ellipse scales X centers and radii directly. The support compiler divides the X normal component by this factor before renormalizing its plane equation.

# src/recovery/IAutoMovieRecoveryDimensionScales.ts#IAutoMovieRecoveryDimensionScales.depthScale

## @evidence contracts/development/common.md#meaningful-documentation

The ellipse scales Z centers and radii directly. The support compiler divides the Z normal component by this factor before renormalizing its plane equation.

# src/recovery/IAutoMovieRecoveryDimensionScales.ts#IAutoMovieRecoveryDimensionScales.heightScale

## @evidence contracts/development/common.md#meaningful-documentation

The shared scaler multiplies the Y offsets from the first interval's lower endpoint, leaving that endpoint fixed.
