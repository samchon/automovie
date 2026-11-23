# src/geometry/curve/AutoMoviePchip64.ts#AutoMoviePchip64

## @evidence contracts/development/design.md#principled-representation

Weighted harmonic interior slopes and bounded three-point endpoint slopes follow Fritsch and Butland, https://doi.org/10.1137/0905021; local power coefficients interpolate the supplied values and derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One scalar field owns its interval coefficients; reusable slope resolution is exposed separately for callers constructing vector or tensor fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No anatomy, smoothing fit, coordinate conversion or replacement endpoint derivative is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative units, caller-owned immutable station storage, knot selection and extrapolation refusal.

# src/geometry/curve/AutoMoviePchip64.ts#AutoMoviePchip64.prototype.at

## @evidence contracts/development/implementation.md#principled-implementation

Horner evaluation uses the interval's local coordinate; differentiating those same power coefficients gives the first derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The derivative switch shares interval selection and coefficient storage with ordinary evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-domain query is rejected rather than clamped or extrapolated, and no derivative normalization changes its units.

## @evidence contracts/development/common.md#meaningful-documentation

States the closed domain, right-interval knot convention and finite-result requirement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Interval search is O(n); the selected cubic then uses a fixed number of scalar operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both query kinds read the coefficients retained by the constructor, without rebuilding slopes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A query retains no prior coordinate or result and allocates no interval arrays.

# src/geometry/curve/AutoMoviePchip64.ts#AutoMoviePchip64.slopes

## @evidence contracts/development/implementation.md#principled-implementation

Secants and interval widths feed the shared Fritsch–Butland weighted harmonic and endpoint-limited slope operation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and coordinate-to-secant conversion precede the independently reusable slope kernel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite secants and nonpositive intervals reject; the function does not substitute a monotone interpolator with a different endpoint rule.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes derivative units, the two-point case and sign-change treatment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear array passes prepare widths and secants, followed by the linear slope kernel.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The result is the reusable slope vector; mutable caller data do not receive a retained cross-call verdict.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary widths and secants expire on return; only the new slope array transfers to the caller.

# src/geometry/curve/AutoMoviePchip64.ts#AutoMoviePchip64.fromSecants

## @evidence contracts/development/implementation.md#principled-implementation

Interior weights are 2hNext+hPrevious and hNext+2hPrevious; one-sided endpoint estimates retain the adjacent secant's sign and three-times bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scalar and vector coefficient producers share this one numerical slope rule without sharing their domain-evaluation policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This low-level operation requires admitted widths/secants and performs no anatomy-dependent tangent override.

## @evidence contracts/development/common.md#meaningful-documentation

States the prevalidated array contract and the number of returned station slopes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One slope per station is computed in O(n), with fixed endpoint calculations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Vector callers reuse their already computed secants rather than rebuild coordinate differences for each derivative query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new output array owns scalar slopes only and retains neither supplied array.

# src/geometry/curve/AutoMoviePchip64.ts#AutoMoviePchip64.fieldSlopes

## @evidence contracts/development/implementation.md#principled-implementation

Independent scalar PCHIP slopes are computed per node and coordinate, preserving the original component order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The nested layout adapter shares scalar admission and limiting rather than introducing a second vector slope formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It performs no spatial tangent normalization, axis fitting or per-node sample fitting.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the station/node/coordinate ordering and corresponding-row premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S stations and N nodes, three scalar columns per node take O(SN) work and output storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One derivative field is returned for downstream coefficient construction; later curve evaluation need not repeat the slope solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary component columns are released and returned triples do not alias the supplied station rows.
