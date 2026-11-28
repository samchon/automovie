# src/geometry/IAutoMoviePreparedSurfaceFrame.ts#IAutoMoviePreparedSurfaceFrame

## @evidence contracts/development/common.md#meaningful-documentation

Centroid-based source frame and three read-only local offsets for one rigid triangle.

## @evidence contracts/development/design.md#principled-representation

Preparation builds an orthonormal basis from ordered triangle edges and projects each original centroid-relative point into that basis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared record owns copied frame and offset coordinates. A destination frame is supplied independently when placing it.

# src/geometry/IAutoMoviePreparedSurfaceFrame.ts#IAutoMoviePreparedSurfaceFrame.frame

## @evidence contracts/development/common.md#meaningful-documentation

Owned source centroid and unit heading and normal. The source basis supports a rigid round trip in the same metre frame.

# src/geometry/IAutoMoviePreparedSurfaceFrame.ts#IAutoMoviePreparedSurfaceFrame.offsets

## @evidence contracts/development/common.md#meaningful-documentation

Three owned centroid-relative offsets in original point order, in metres along forward, normal cross forward and normal.
