# src/recovery/IAutoMovieRecoveryImageSupportsPreparationOperation.ts#IAutoMovieRecoveryImageSupportsPreparationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The callable states the measured view population and source-row counts, and gives the units and axes of each returned value. The support matrix uses source view order and then increasing station order.

## @evidence contracts/development/design.md#principled-representation

Recovery validates each original camera chart, its increasing physical row order, interior pixel addresses and adjacency. It intersects the measured Y ranges, orders the unique in-range stations and interpolates lower and upper bounds only within each view's measured range. Elliptic and convex-support fitting consume this same view-by-station matrix.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result holds the common range, dimensionless view directions and one millimetre support interval per view and station. Input observations retain their measured rows. The family fitter owns its later profile or control coefficients.
