# src/geometry/curve/AutoMovieCanonicalBoundary64.ts#AutoMovieCanonicalBoundary64.phase

## @evidence contracts/development/implementation.md#principled-implementation

Binary64 decoding, exact aligned subtraction and integer multiplication compute the affine dyadic; integer quotient/remainder rounding implements nearest-even.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exact result supplies both identity and its numeric view; endpoint authority is retained directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rounded subtraction, decimal identity, phase clamp or epsilon comparison changes the exact affine result.

## @evidence contracts/development/common.md#meaningful-documentation

States key encoding, normalized inputs, signed-zero endpoints and possible rounded endpoint coincidence.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of BigInt shifts, products and divisions operate on O(W) bits, W at most 2149 for binary64 affine phases; normalization visits trailing zero bits and key formatting visits result bits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same normalized exact result supplies the key and rounded value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar/string result escapes; DataViews and BigInts are call-local and no cache or native handle is acquired.

# src/geometry/curve/AutoMovieCanonicalBoundary64.ts#AutoMovieCanonicalBoundary64.local

## @evidence contracts/development/implementation.md#principled-implementation

Exact dyadic subtraction forms (q-start)/(end-start); integer rational rounding preserves endpoint tests before numeric conversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Exact-key admission precedes interval admission and one inverse rounding; authority selection stays outside the numeric ABI.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No numeric reconstruction from rounded q, clamping, tolerance or authority inference substitutes for the supplied key.

## @evidence contracts/development/common.md#meaningful-documentation

States exact range checking, endpoint collapse refusal, numeric/key consistency and caller authority responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Key parsing visits at most 550 characters; fixed aligned BigInt operations and one rational division process O(W) bits from bounded binary64 phase keys.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Parsed exact q serves consistency, range and inverse checks without another interpolation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the inverse scalar escapes; key parsing and rational buffers are call-local with no retained cache or handles.

# src/geometry/curve/AutoMovieCanonicalBoundary64.ts#AutoMovieCanonicalBoundary64.compare

## @evidence contracts/development/implementation.md#principled-implementation

Validated dyadics are aligned and subtracted exactly before taking their sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar comparison serves schedule sorting and directed interval membership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rounded-value coincidence does not merge or reorder canonical addresses.

## @evidence contracts/development/common.md#meaningful-documentation

States exact-key ordering and the distinction from numeric views.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two bounded key parses and O(W)-bit aligned subtraction determine one sign.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each key is parsed once per comparison.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a signed scalar escapes; parsed BigInts are call-local.

# src/geometry/curve/AutoMovieCanonicalBoundary64.ts#AutoMovieCanonicalBoundary64.inverse

## @evidence contracts/development/implementation.md#principled-implementation

Exact phase comparisons bracket the same callback used for forward transport; ordered IEEE bit bisection terminates on its finite local domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forward callback and its immutable authored anchors define both transports, avoiding an independently rounded inverse formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No phase epsilon, coordinate rounding, shape resampling, special address override or endpoint clamp changes canonical identity or authored locals.

## @evidence contracts/development/common.md#meaningful-documentation

States directed anchors, finite inverse semantics, unattainable phases and explicit refusal cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

A anchors cost O(A) forward evaluations and exact comparisons; at most 62 additional callback evaluations bisect the positive unit binary64 bit range, in addition to caller callback cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Caller-owned forward anchors are reused for interval selection and exact authored hits; each bisection evaluates its midpoint once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one local scalar escapes; the fixed eight-byte DataView and phase brackets are call-local, with no retained callback or cache.

# src/geometry/curve/AutoMovieCanonicalBoundary64.ts#AutoMovieCanonicalBoundary64.partition

## @evidence contracts/development/implementation.md#principled-implementation

An endpoint event sweep admits exact numeric endpoint order and records the active uses on each open atomic interval, with directed local-to-canonical transport.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Authority grouping, endpoint events and atom publication separate identity, interval coverage and caller topology decisions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate matching, interval epsilon, global incident-count shortcut or hidden gap removal changes declared coverage.

## @evidence contracts/development/common.md#meaningful-documentation

States open atoms, deterministic order, input/output walk frames, gap semantics and the limited meaning of incidence diagnostics.

## @evidence contracts/development/implementation.md#efficient-algorithms

For U uses and A atoms, sorting events costs O(U log U) comparisons; sorting each atom's M active IDs costs O(M log M), with O(U+sum M) storage including returned coverage. String comparison visits key bytes; explicit multiplicity can make output quadratic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One endpoint event map and active-use map per authority serve every atom without rescanning all input intervals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local maps expire on return or failure; returned atoms/diagnostics scale with declared interval incidences and are caller-owned, with no global cache or native resource.
