# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The input connects the original mesh, measurement axis and affine witnesses to their shared metre frame and output paths.

## @evidence contracts/development/design.md#principled-representation

The owner admits a valid axis, safe original ordinals and finite weights, gap and referenced coordinates. Finite affine extrapolation remains admitted. It computes the weighted front point, subtracts the signed gap along the measured axis and refuses nonfinite endpoints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation needs only the front position view and original witnesses. The inspection record owns output paths, endpoints and flags.

# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps.path

## @evidence contracts/development/common.md#meaningful-documentation

The supplied prefix is preserved and extended by the output witness ordinal.

# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps.front

## @evidence contracts/development/common.md#meaningful-documentation

Only packed positions from the measured front mesh are borrowed, in the measurement's own metre frame.

# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps.axis

## @evidence contracts/development/common.md#meaningful-documentation

The measured axis selects the coordinate from which the gap is subtracted to obtain the back endpoint.

# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps.witnesses

## @evidence contracts/development/common.md#meaningful-documentation

The ordered borrowed witnesses include clear observations and give one mark each. Empty input produces no marks.

# src/geometry/IAutoMovieMarkMeshClearance.ts#IAutoMovieMarkMeshClearance.IProps.anchor

## @evidence contracts/development/common.md#meaningful-documentation

The value labels the shared object frame by scene path or identifies world coordinates with null.
