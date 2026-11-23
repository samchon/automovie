# src/geometry/sweep/sampleAutoMovieSweepSection.ts#sampleAutoMovieSweepSection

## @evidence contracts/development/implementation.md#principled-implementation

The polar radius function of a star-shaped closed curve: a dense parameter walk brackets each direction and bisection on the curve's monotone polar angle converges to the unique crossing, accurate to 2^-40 of a bracket; the finite star-shape check requires strict increase at walk samples but cannot certify unsampled intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Evaluation of all four section kinds is local to this module, so the sweep compiler sees only radii by direction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-star-shaped or clockwise curve is refused instead of being reordered or hulled, and out-of-range half-axes, exponents or point counts are refused rather than clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle convention, how each kind is read, the accuracy, the sampled star-shape and winding check and its limitation, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

A centred superellipse costs O(C) closed-form radii. Otherwise, for S curve segments and C angles: O(64 S) for the walk and O(C (log S + 40)) for bracketing and bisection; a radial section costs O(C) after its O(m) interpolant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per station when a sweep compiles; the compiled sweep keeps the radii.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the walk's arrays, O(64 S), are released on return and the radii array is transferred to the caller.
