# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.cubicCriticalParameters

## @evidence contracts/development/common.md#meaningful-documentation

States coefficient basis, normalized parameter, caller mapping responsibility and unaltered source semantics.

## @evidence contracts/development/implementation.md#principled-implementation

The coefficient helper differentiates the source cubic and delegates D=0, affine critical and stationary candidates to the existing engine polynomial-root owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This namespace entry exposes one shared numerical owner to the two algorithms and their actual input adapter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite-difference endpoint movement, source samples or epsilon root merging is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed degree-two equations give bounded work independent of any mesh or source curve count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned classification is reusable by both methods for the same admitted coefficients.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The pure wrapper retains no controls, callbacks or external resources.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

Gives parameter range and assumes an admitted finite coefficient record.

## @evidence contracts/development/implementation.md#principled-implementation

The quadratic Bernstein quotient is the standard rational conic representation with endpoint weights one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared evaluation prevents basis differences between fitting and reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source samples, weight correction or specimen branch changes the coefficients.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and one output tuple are independent of source complexity.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bernstein factors and denominator are calculated once per evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The pure call retains no input or resources after return.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.distance

## @evidence contracts/development/common.md#meaningful-documentation

States the returned physical unit and same-frame premise.

## @evidence contracts/development/implementation.md#principled-implementation

Math.hypot computes the Euclidean norm of the coordinate difference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared scalar geometry has no fitting or I/O responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rounding, clamping or specimen constants alter the distance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic requires no retained storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each coordinate difference is evaluated once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No resources or state survive the call.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.cross

## @evidence contracts/development/common.md#meaningful-documentation

States the signed determinant and its geometric consumers.

## @evidence contracts/development/implementation.md#principled-implementation

The 2-by-2 determinant measures oriented parallelogram area.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both algorithms share the primitive without a solver dependency.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or absolute value erases orientation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two products and one subtraction have constant cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No repeated source work is performed by this arithmetic helper.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns no retained state or external handle.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.validate

## @evidence contracts/development/common.md#meaningful-documentation

Lists invalid-domain, boundary and budget effects; callbacks are checked when queried.

## @evidence contracts/development/implementation.md#principled-implementation

Finite interval and budget checks establish the adaptive subdivision preconditions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Common admission owns structural checks; each paper owns differential premises.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid options produce diagnostics without defaults, clamping or callback invocation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission scans B source breaks once, using O(B) diagnostic storage only on failure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers validate once before fitting their intervals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No callbacks, source arrays or process resources are retained.
