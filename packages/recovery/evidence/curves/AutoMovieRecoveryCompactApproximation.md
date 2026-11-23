# src/curves/AutoMovieRecoveryCompactApproximation.ts#AutoMovieRecoveryCompactApproximation.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

States normalized parameter and millimetre output, and does not borrow a source evaluator.

## @evidence contracts/development/implementation.md#principled-implementation

Existing engine Bernstein evaluation and the existing rational conic quotient implement the two admitted representations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One dispatch keeps generation and fitter coefficient semantics identical.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No resampling, source interpolation or fallback curve changes stored coefficients.

## @evidence contracts/development/implementation.md#efficient-algorithms

Degree is at most five; two scalar Bernstein evaluations use constant bounded work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rational evaluation reuses the existing conic owner; polynomial evaluation reuses engine algebra.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary scalar arrays expire after each pure call; no input or handle is retained.

# src/curves/AutoMovieRecoveryCompactApproximation.ts#AutoMovieRecoveryCompactApproximation.storedScalars

## @evidence contracts/development/common.md#meaningful-documentation

Defines two coordinates per control, one degree or weight, two interval endpoints and exact shared-endpoint accounting.

## @evidence contracts/development/implementation.md#principled-implementation

Direct coefficient cardinality measures stored numbers rather than output tessellation or source observation counts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same owner supplies candidate and final representation cost.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coordinate plane reduction is not attributed to polynomial degree, and no approximate endpoint equality hides a gap.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over P pieces costs O(P) with scalar scratch only.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjacent controls are read once per seam; no sample generation is needed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function borrows the immutable coefficient array and retains no data after return.
