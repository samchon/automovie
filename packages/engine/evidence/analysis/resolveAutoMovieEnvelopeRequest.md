# src/analysis/resolveAutoMovieEnvelopeRequest.ts#resolveAutoMovieEnvelopeRequest

## @evidence contracts/development/implementation.md#principled-implementation

One ordered pass checks the declared scalar bounds, uses Sets for id uniqueness and bridge-to-assembly references, and delegates context and targets to shared validators. Positive finite scalar inputs make the ideal resistance positive but do not prevent binary64 division, summation or reciprocal overflow/underflow; computed nonfinite metrics are refused later rather than certified here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The request check lives beside the analyzer it serves and returns the instant it had to look up, so the analyzer neither repeats the lookup nor asserts it non-null.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No study, assembly or fixture is special-cased; the only constant is `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, which bounds assemblies because each yields one sample, and nothing is clamped or defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states where the refused inputs are listed, their check order, the per-list uniqueness and the bridge reference rule, and what the returned instant is.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the context, assemblies A with their layers, bridges B and targets, with hashed uniqueness and reference checks instead of pairwise scans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The instant lookup is done once here and handed to the analyzer, which uses it for both the settings text and the exterior temperature.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The assembly, layer and bridge id sets are call-local and grow with A, the largest assembly's layers and B; the returned instant is a reference into the caller's context.
