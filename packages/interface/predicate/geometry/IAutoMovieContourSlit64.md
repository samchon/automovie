# src/geometry/IAutoMovieContourSlit64.ts#IAutoMovieContourSlit64.IClosestResult

## @evidence contracts/development/common.md#meaningful-documentation

The projection documents clamping, zero-length behavior and representable coordinate arithmetic.

## @evidence contracts/development/design.md#principled-representation

The helper divides the dot product of the query offset and segment direction by the squared chord length and clamps the fraction. A zero chord length selects its endpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result holds the projection, its parameter and its distance in one input frame. Callers own source curve evaluation and diagnostics.

# src/geometry/IAutoMovieContourSlit64.ts#IAutoMovieContourSlit64.IClosestResult.p

## @evidence contracts/development/common.md#meaningful-documentation

The fresh tuple is the affine point at the clamped segment fraction.

# src/geometry/IAutoMovieContourSlit64.ts#IAutoMovieContourSlit64.IClosestResult.t

## @evidence contracts/development/common.md#meaningful-documentation

The dimensionless fraction lies from zero through one for admitted arithmetic and is zero at coincident endpoints.

# src/geometry/IAutoMovieContourSlit64.ts#IAutoMovieContourSlit64.IClosestResult.distance

## @evidence contracts/development/common.md#meaningful-documentation

The reported separation is the Euclidean norm from the query to the projected point, in the original length unit.
