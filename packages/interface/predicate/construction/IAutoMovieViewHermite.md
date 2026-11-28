# src/construction/IAutoMovieViewHermite.ts#IAutoMovieViewHermite.ICurve

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the source derivative coordinate from the normalized span evaluation coordinate.

## @evidence contracts/development/design.md#principled-representation

ViewHermite.create uses natural or authored knot derivatives, converts authored normalized jets back to the source coordinate, and packs quintic spans. Optional range checks use the control hull before the curve is returned.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The preparation reuses the natural spline's knot and value rows. It adds only the derivatives and coefficients needed for repeated value and jet reads.

# src/construction/IAutoMovieViewHermite.ts#IAutoMovieViewHermite.ICurve.xs

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the array's coordinate and shared ownership.

# src/construction/IAutoMovieViewHermite.ts#IAutoMovieViewHermite.ICurve.ys

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies how knot values align to the parameter array.

# src/construction/IAutoMovieViewHermite.ts#IAutoMovieViewHermite.ICurve.first

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the prepared first derivative scale.

# src/construction/IAutoMovieViewHermite.ts#IAutoMovieViewHermite.ICurve.second

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the prepared second derivative scale.

# src/construction/IAutoMovieViewHermite.ts#IAutoMovieViewHermite.ICurve.coefficients

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the normalized polynomial basis and implicit constant term.
