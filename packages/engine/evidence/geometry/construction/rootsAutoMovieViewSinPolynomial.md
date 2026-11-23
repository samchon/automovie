# src/geometry/construction/rootsAutoMovieViewSinPolynomial.ts#rootsAutoMovieViewSinPolynomial

## @evidence contracts/development/implementation.md#principled-implementation

Uses analytic differentiation and derivative-root monotone partitioning, terminating at the known zeros of a single sine/cosine on [0,pi]. A bracket requires opposite signs; near-zero cuts separately preserve even-multiplicity candidates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded scalar helper extends the existing polynomial root owner only for the affine physical-station term of a pole-parameter source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled grid, polynomial sine replacement, source clamp or claim of exact root certification is used; invalid or unrepresentable arithmetic returns a named failure.

## @evidence contracts/development/common.md#meaningful-documentation

States coefficient order, degree, angular/subinterval premises, recursive termination and binary64 multiple-root limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Degree at most four bounds recursion to five levels, at most 63 returned candidates and 64 bisections per sign-changing monotone bracket; zero amplitude delegates to the existing polynomial owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Normalizes the combined terms once and prepares their derivative coefficient rows and sine amplitudes once for all recursive reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All coefficient rows, bracket cuts and candidates are invocation-local and bounded by degree; no source, cache or external resource is retained.
