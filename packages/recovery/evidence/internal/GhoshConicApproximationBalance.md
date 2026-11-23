# src/index.ts#GhoshConicApproximationBalance

## @evidence contracts/development/common.md#meaningful-documentation

Explains extrema exchange, compactified weight, physical error, endpoint zeros, finite-bracket limits and absent-result effects.

## @evidence contracts/development/implementation.md#principled-implementation

Ghosh's equioscillation minimizes opposing signed normal lobes; scalar bisection is alternated with bracketed extremum optimization instead of accepting sampled maxima. Golden-section convergence stops at binary64 parameter resolution and invalid normal graphs remain unsupported.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The helper owns weight/extremum search while its caller owns differential admission, tangent geometry, independent validation and interval coverage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sample-count increase, inflated fit tolerance, input smoothing, missing-domain bridge or fixture-specific coefficient is used. New fitting nodes are located extrema and a roundoff allowance only controls search convergence.

## @evidence contracts/development/implementation.md#efficient-algorithms

For E bounded exchanges, N initial/located extrema and G golden iterations, time is O(E*(32*N+N*G)); the caller's depth bounds E and binary64 precision bounds G. Source-coordinate caching avoids repeated callbacks at identical parameters.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A call-local parameter map reuses source points/normals throughout weight iterations and peak refinement; source identity and interval are fixed for the call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fit nodes and cached coordinates are bounded by exchanges and golden iterations, discarded on return, and never appear in the returned coefficients.
