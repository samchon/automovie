# src/internal/calibrateRecoveryEpipolarMatrix.ts#calibrateRecoveryEpipolarMatrix

## @evidence contracts/development/implementation.md#principled-implementation

Original 3-by-3 SVD of K2-transpose F K1 supplies two essential directions. Equal unit singulars impose calibration, cross products complete proper orthonormal frames, and the two quarter-turn compositions with both translation signs retain every pose ambiguity for later cheirality.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This recovery helper owns the calibrated projection while generic decomposition, cross products and row-major composition remain in engine. It does not choose a pose or certify image residuals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No truth orientation, minimum singular floor, zero third left singular vector or forced cheirality chooses a camera. Rank-deficient and nonrepresentable decompositions throw.

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate direction, row order, unit-baseline gauge, four unresolved candidates, primary method and relative projection discrepancy.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded 3-by-3 SVD and fixed-size products cost O(S) time and constant storage independent of image size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same factorization supplies essential projection, discrepancy and all four poses; neither pixel matrix nor calibration is decomposed again for each sign.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local factors expire on return or throw; only owned fixed-size matrices, translations and a scalar discrepancy escape, with no cache or handle.
