# src/geometry/construction/AutoMovieSolidBlend.ts#AutoMovieSolidBlend.jet

## @evidence contracts/development/implementation.md#principled-implementation

Applies the quintic Hermite value, first and second derivative weights to both ribbons' supplied 2-jets; finite representable inputs are required for finite output.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local weighted-sum reader produces the three derivative orders from the same six source vectors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither clamps w nor rescales the caller's ribbons; extrapolated, nonfinite or folded results remain observable.

## @evidence contracts/development/common.md#meaningful-documentation

Gives endpoint signs, extrapolation and dimensionless cross-parameter derivative units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic: one three-by-six basis and three sums of six three-component vectors, without a search or iteration.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads one basis for the same w across all coordinate sums; independent calls, including Join's separate fold reads, repeat this work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates call-local weights and sums, returning three fresh vectors without retaining either input ribbon.

# src/geometry/construction/AutoMovieSolidBlend.ts#AutoMovieSolidBlend.basis

## @evidence contracts/development/implementation.md#principled-implementation

The degree-five Hermite polynomials satisfy the two endpoint value/first/second interpolation conditions, ordered start value/first/second then end second/first/value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three literal rows expose the polynomial and both analytic derivatives; no fitted coefficients or lookup table is involved.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Evaluates the requested t without clamping; binary64 cancellation or overflow is not replaced by an endpoint or fabricated finite result.

## @evidence contracts/development/common.md#meaningful-documentation

States row order and all six column meanings for unit-span parameter derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-degree arithmetic constructs eighteen weights; cost and output size do not depend on a mesh or station count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes t squared through t to the fifth once and shares those powers among all three rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three fresh six-number arrays and retains no parameter-keyed table.
