# src/geometry/construction/AutoMovieHarmonicCurve.ts#AutoMovieHarmonicCurve.width

## @evidence contracts/development/implementation.md#principled-implementation

One constant and one sine/cosine pair per harmonic give 2K+1 entries for a nonnegative integer order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The layout arithmetic lives beside the series readers that use its offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the supplied order's width without rounding or choosing a consumer-specific order; validation belongs to the producer.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a single coordinate block rather than the two-coordinate array's total size.

## @evidence contracts/development/implementation.md#efficient-algorithms

One multiplication and addition take constant time and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This scalar layout calculation coordinates no phases or requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returning a number retains no state or handle.

# src/geometry/construction/AutoMovieHarmonicCurve.ts#AutoMovieHarmonicCurve.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the declared finite Fourier sum and its analytic phase derivative; the producer supplies K complete coefficient pairs in each block.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Values and first derivatives share one harmonic loop and one four-number result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the coefficients' own derivatives without sampled differences, clipping or shape-specific terms.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the coefficient layout, harmonic count, phase units and returned derivative units.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K) arithmetic and two trigonometric calls per harmonic, with O(1) working storage; no recurrence or measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each sine/cosine pair contributes to both coordinate values and derivatives in that iteration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the caller-owned four-number tuple escapes; coefficients are read without mutation or retention.

# src/geometry/construction/AutoMovieHarmonicCurve.ts#AutoMovieHarmonicCurve.project

## @evidence contracts/development/implementation.md#principled-implementation

Uniform phases with N>2K make the Fourier columns orthogonal, so their direct weighted projections solve the stated least-squares problem up to floating-point summation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two coordinate blocks accumulate together instead of constructing a general normal-equation solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects too few samples; uniform phase spacing and a valid nonnegative integer order remain caller premises rather than inferred geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States uniform sample phases, the orthogonality premise and the coefficient units/layout.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(NK) direct projection and O(K) output avoid a dense matrix; no FFT or optimality for arbitrarily large K is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A sample's weighted sine/cosine serves both coordinates; completed projections are returned for the caller to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one 2(2K+1)-entry output; no sample or transform state remains in this module.
