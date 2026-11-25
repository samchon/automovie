# src/geometry/construction/AutoMovieAxisDirection.ts#AutoMovieAxisDirection.project

## @evidence contracts/development/implementation.md#principled-implementation

Orthogonal subtraction is recomputed from max-scaled input when its raw norm is subnormal or nonfinite; the same positive scale changes neither direction nor relative projection. If whole-input scaling erases a finite nonzero raw normal component, that original projection/norm scale is retained for safe unitization.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the projected vector and both same-scale norms without making an axis admission decision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains zero/nonfinite results when the input has no usable finite scaling; it does not invent a frame or weaken the caller's conditioning rule.

## @evidence contracts/development/common.md#meaningful-documentation

Requires the caller's admitted unit tangent and explains optional full-norm reuse and scale ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

One ordinary projection and hypot; the exceptional numeric regime adds one fixed-size rescaling and projection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accepts an already measured target norm and returns the projected norm for unitization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one returned fixed-size record survives; all input data remains caller-owned and unmodified.

# src/geometry/construction/AutoMovieAxisDirection.ts#AutoMovieAxisDirection.unit

## @evidence contracts/development/implementation.md#principled-implementation

The ordinary reciprocal multiply is preserved for normal finite norms; max-component scaling measures subnormal/overflowing norms without quantizing the direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One vector operation serves tangent and projected-up normalization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not replace zero or nonfinite inputs with an arbitrary axis, and uses no minimum geometric length.

## @evidence contracts/development/common.md#meaningful-documentation

States optional same-vector norm reuse and invalid-input ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant three-component work with an additional rescaling only outside the ordinary numeric regime.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses a supplied norm; otherwise measures it once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one local vector and retains no state.

# src/geometry/construction/AutoMovieAxisDirection.ts#AutoMovieAxisDirection.reflect

## @evidence contracts/development/implementation.md#principled-implementation

Uses a-2v(v.a)/(v.v); only an underflowing/overflowing squared norm switches to the mathematically identical unit-normal expression. A truly zero normal retains the existing identity convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constant-work reflection is shared by both RMF reflections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No minimum geometric chord, sampled frame, substitute direction or modified transport theory is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Requires an admitted unit input direction, states squared-norm reuse, the numerical branch and zero-normal convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary reflection retains its original dot/divide/multiply sequence; the exceptional numeric range adds one safe normalization.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accepts the caller's already measured squared norm and delegates exceptional unitization to the same owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one local vector; zero-normal identity returns the supplied vector and retains no new state.
