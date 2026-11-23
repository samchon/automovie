# src/curves/findAutoMovieRecoveryCubicCriticalParameters.ts#findAutoMovieRecoveryCubicCriticalParameters

## @evidence contracts/development/common.md#meaningful-documentation

States the derivative polynomials, normalized parameter, source preservation, conditioning, degenerate cases and numerical proof limits.

## @evidence contracts/development/implementation.md#principled-implementation

Cubic differentiation gives the exact bounded-degree critical equations in real arithmetic; binary64 root candidates reuse the engine's normalized monotone-partition owner and stationary candidates require both velocity components to vanish within Horner roundoff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This pure coefficient helper owns one derivation; the shared namespace exposes it to Ahn, Ghosh and their source-chart adapter without artifact I/O.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No Human coordinates, finite-difference offsets, epsilon root merging, endpoint displacement or altered source jets are used. Nonfinite controls or unrepresentable edge arithmetic throw RangeError.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed four-control source yields polynomial degrees at most two; the engine solver has bounded derivative recursion and 60 bisections, giving constant work and storage per cubic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One difference/normalization pass supplies the velocity, curvature and affine critical polynomials; callers may reuse the returned candidates for both algorithms.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All coefficients and root arrays are call-local; only scalar parameters and diagnostics transfer to the caller, with no retained source or external resource.
