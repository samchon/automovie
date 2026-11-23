# src/geometry/curve/generateAutoMovieSupportCurve64.ts#generateAutoMovieSupportCurve64

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates X=h*n+h'*t and its analytic tangent, then forms cubic Hermite controls on a fixed normal-angle partition; a Fourier derivative majorant bounds the mathematical interpolation remainder.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One generic operation owns the support equation, convexity admission and explicit polynomial approximation; anatomical frames and fitted coefficients belong to its callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads no source mesh, specimen identity or expected shape and changes no supplied coefficient to force convexity or a smaller reported approximation error.

## @evidence contracts/development/common.md#meaningful-documentation

States units, angle parameter, support perimeter, finite work limits and the distinction between numerical estimates and outward certificates.

## @evidence contracts/development/implementation.md#efficient-algorithms

For degree N, K cubic spans and S curvature samples, evaluation costs O(N*(K+S)); positive curvature uses successively doubled grids from 16 through 4096 samples, at most 8176 samples in total, and an analytic Lipschitz remainder.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each endpoint position and tangent in both incident Hermite spans and reuses harmonic amplitudes in both derivative majorants.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most 17 coefficient pairs and 4096 spans are admitted; local samples are discarded and only the generated curve and scalar qualifications transfer to the caller.
