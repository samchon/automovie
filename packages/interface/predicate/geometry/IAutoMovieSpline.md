# src/geometry/IAutoMovieSpline.ts#IAutoMovieSpline.IFitM

## @evidence contracts/development/common.md#meaningful-documentation

Writable destination with one second derivative per fitted spline knot.

## @evidence contracts/development/design.md#principled-representation

The spline fitter fills the knot second derivatives associated with the returned shared tension. Their unit is ordinate per knot unit squared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The destination remains with the caller and can serve later spline evaluation with the same data and tension.

# src/geometry/IAutoMovieSpline.ts#IAutoMovieSpline.IFitScratch

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned writable workspace of at least 7n + 17 scalars for fitting n knots.

## @evidence contracts/development/design.md#principled-representation

The fitter reuses this workspace for tension trials and intermediate linear-system terms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scratch is supplied independently of the derivative destination so caller-owned storage can be reused across fits.
