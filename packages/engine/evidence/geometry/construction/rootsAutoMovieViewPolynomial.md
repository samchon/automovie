# src/geometry/construction/rootsAutoMovieViewPolynomial.ts#rootsAutoMovieViewPolynomial

## @evidence contracts/development/implementation.md#principled-implementation

Recursively partitions at derivative roots, then bisects every sign-changing monotone interval and retains near-zero partition cuts for repeated roots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded-degree helper supplies source critical and squared-distance candidates while preserving the existing arithmetic for degrees at most four.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not fit sampled values or label a zero polynomial's continuum as isolated roots; its floating residual test is stated rather than presented as certification.

## @evidence contracts/development/common.md#meaningful-documentation

States coefficient order, degree/domain, iterations, residual allowance and numerical proof limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Degree d is at most nine; a conservative candidate bound is 2^d-1 because residual observations may exceed d. Horner evaluation and 60 bisections give O(60*d*2^d) work including the derivative recursion, plus bounded candidate sorting.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pure observation schedules no reusable effects; the caller can retain its source critical stations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Depth at most nine and O(2^d+d^2) invocation-local candidate/coefficient storage retain no curve; at most 511 candidates are returned.
