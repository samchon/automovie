# src/recovery/IAutoMovieRecoveryScalarProfilesFittingOperation.ts#IAutoMovieRecoveryScalarProfilesFittingOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The signature names the shared station chart, value-column order, explicit rank threshold, and the millimetre-to-metre boundary.

## @evidence contracts/development/design.md#principled-representation

The fitter factors the original station design with Householder QR. It reuses the factorization across all fields and converts each segment's endpoint value and derivative to a cubic Bernstein row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Profile fitting owns the ordinate samples, numerical rank diagnostic and spline coefficients. The loft owners give each column its physical meaning.
