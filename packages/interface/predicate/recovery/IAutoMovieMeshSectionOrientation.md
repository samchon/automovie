# src/recovery/IAutoMovieMeshSectionOrientation.ts#IAutoMovieMeshSectionOrientation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation supplies a local winding witness for an actual closed contour, with explicit material sign or signed-volume inference and diagnosed unsupported observations.

## @evidence contracts/development/design.md#principled-representation

The witness combines a common source-face direction, oriented cut tangent and signed planar area to decide outer or cavity winding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller owns any supplied material sign. The operation measures one observed contour's source orientation without changing its stored point order.
