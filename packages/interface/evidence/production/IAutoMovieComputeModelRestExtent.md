# src/production/IAutoMovieComputeModelRestExtent.ts#IAutoMovieComputeModelRestExtent.IResult

## @evidence contracts/development/design.md#principled-representation

Bounds use model metres after part placement and attached-bone rest placement; null denotes no measured three-axis extent. Geometry/skeleton admission is delegated to their engine owners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

computeModelRestExtent produces the three-axis extent consumed by the shot subject framer and the vertical projection computeModelRestExtentY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The nullable box distinguishes unmeasurable geometry from a valid degenerate extent; external asset bytes and animated deformation are outside this measurement.

## @evidence contracts/development/common.md#meaningful-documentation

Nullable model-frame rest bounds used by camera subject measurement. Bounds use model metres after part placement and attached-bone rest placement; null denotes no measured three-axis extent. Geometry/skeleton admission is delegated to their engine owners.
