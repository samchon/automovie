# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.create

## @evidence contracts/development/implementation.md#principled-implementation

Admits finite ordered knots and zero radial pole knots at the source coordinate's same singular ends. An open retained end leaves that original coordinate unchanged. Explicit jet/range data alone selects shared-jet quintics through their owning validator; interval arithmetic must be representable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission path serves open and both pole forms and returns the existing diagnostic contract on failure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not sort, merge, clamp or replace malformed knots, and refuses unrepresentable parameter intervals or cubic coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

Documents source ownership, pole units, explicit failures and the lack of a half-space guarantee.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) copying, admission and tridiagonal preparation, followed by one interval pass for finite polynomial arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Stores one spline whose curvature solve is reused by every value, jet and critical-station reading of the copied inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns O(n) copied knots and spline arrays; temporary parameter arrays belong to that preparation and no global state retains the source.

# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.criticalStations

## @evidence contracts/development/implementation.md#principled-implementation

Solves natural cubic derivative quadratics with the cancellation-avoiding q formula; explicit quintics delegate to their monotone-partition derivative-root owner. Both retain only interior roots and invert the same source parameter. These binary64 observations are not interval certificates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns only additional interior sampling stations; the caller already owns all named knots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Constant spans yield no invented isolated root; no sampled fitting or extrema clamp is used.

## @evidence contracts/development/common.md#meaningful-documentation

States excluded knot endpoints, constant-span meaning and the numerical proof limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One span pass plus bounded degree-four root work for requested quintics; the natural path sorts at most two roots per span. Whole-source work is O(n log n) or less, with no source-value sampling grid.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads one prepared source once; callers can retain this derived sample list while the source stays unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Natural spans return at most two roots; requested quintics can retain near-zero partition candidates, bounded by fifteen observations per span. No list is cached globally.

# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.supportStations

## @evidence contracts/development/implementation.md#principled-implementation

Delegates analytic affine-station plus original-source differentiation to the fixed-chart support owner, retaining the actual pole sine term and binary64 critical-root limitations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One source API exposes endpoint/knot/critical candidates for a fixed affine origin; no world-frame or moving-axis interpreter is added.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not replace the original curve, use sampled maxima, clamp roots or claim interval-certified extrema.

## @evidence contracts/development/common.md#meaningful-documentation

The support owner specifies coefficient units, closed subdomain, constant-offset independence, returned candidates and numerical failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear span pass with bounded-degree root work and sorting of O(n) candidates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses this admitted source's natural/Hermite preparation and parameter inverse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only caller-owned station candidates or a failure string; retains no new state.

# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.distanceStations

## @evidence contracts/development/implementation.md#principled-implementation

Delegates differentiation of (station-targetStation)^2+(source-targetValue)^2 in the original station/root parameter; the caller establishes the fixed chart and common units.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar-graph query returns closed-domain endpoints, named knots and numerical critical candidates without interpreting a world frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Angle parameters fail explicitly; moving frames and general three-dimensional compositions are outside this scalar signature. No source fitting, clamping or certified maximum is substituted.

## @evidence contracts/development/common.md#meaningful-documentation

The distance owner states the target/domain units, singleton meaning, polynomial degrees and binary64 limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits n source spans with degree at most nine root work, then sorts O(n) candidates in O(n log n); the distance owner states the bounded per-span root cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the admitted natural/Hermite coefficients and the exact source parameter inverse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns an invocation-owned station list or failure string and retains no new state.

# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.value

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same admitted natural or requested quintic source as at, including exact radial pole zeros and parameter-tangent extension at an open end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A scalar or explicit failure avoids constructing a jet record for lofting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Out-of-domain and nonfinite values remain failures; no range or endpoint-neighbour clamp is applied.

## @evidence contracts/development/common.md#meaningful-documentation

States the value-only use and the shared source semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(log n) natural or prepared-quintic lookup, with no derivative work, arrays or reading record on a successful query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the admitted spline and shared parameter/value helpers; changing knots requires a new preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and returns a scalar or failure string.

# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.at

## @evidence contracts/development/implementation.md#principled-implementation

Reads the shared natural or requested quintic scalar and analytic parameter derivatives, applying the exact first/second chain rule for root/angle parameters.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One qualified reading supplies both parameter and station jets; value serves callers needing only a scalar.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Pole station jets are absent, overflowing jets are named nonfinite, and a finite value is retained; no finite-difference derivative or substituted point is used.

## @evidence contracts/development/common.md#meaningful-documentation

Documents derivative units, pole status and source versus final-loft meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

One combined O(log n) natural lookup or two O(log n) quintic searches supply value and derivatives. An exact pole keeps its input zero and only reads parameter derivatives.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Natural value and derivatives share a selected interval; all readers retain the original curvature/parameter preparation without a mutable query cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fixed-size reading and jets, retaining no previous query.

# src/geometry/construction/AutoMovieViewOutline.ts#AutoMovieViewOutline.scale

## @evidence contracts/development/implementation.md#principled-implementation

Scales stations and parameter endpoints together; values, normalized jets and range bounds use their scalar factor. A negative scalar factor exchanges lower/upper bounds, preserving the same source under unit conversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conversion owner serves tree-to-kernel and kernel-to-tree source records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves site identities and the declared parameter; no station sampling or implicit radial zero is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States independent station/value scales and finite-factor premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) knot copying and constant parameter conversion.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Converts one record once, with no effectful work to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh source knots and a copied parameter; no input object is retained.
