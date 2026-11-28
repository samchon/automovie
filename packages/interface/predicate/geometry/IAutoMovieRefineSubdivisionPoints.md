# src/geometry/IAutoMovieRefineSubdivisionPoints.ts#IAutoMovieRefineSubdivisionPoints.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result gives vertex, edge and face order, local metre units, affine mask meaning and independent array ownership.

## @evidence contracts/development/design.md#principled-representation

The refinement kernel computes face points, then edge points and vertex masks. UV refinement reads the same masks under parent fan ordering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result carries generated points and reusable masks. It leaves topology admission and child connectivity to their respective owners.

# src/geometry/IAutoMovieRefineSubdivisionPoints.ts#IAutoMovieRefineSubdivisionPoints.IResult.points

## @evidence contracts/development/common.md#meaningful-documentation

The new packed XYZ array contains one triple per parent vertex, edge and face in that order.

# src/geometry/IAutoMovieRefineSubdivisionPoints.ts#IAutoMovieRefineSubdivisionPoints.IResult.masks

## @evidence contracts/development/common.md#meaningful-documentation

The masks retain parent vertex order and their internal coefficients match the topology's incident fan order.
