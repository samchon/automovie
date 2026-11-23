# src/effectRuntime/validateProductionFilmEffectRuntime.ts#validateProductionFilmEffectRuntime

## @evidence contracts/development/implementation.md#principled-implementation

Integrity by recomputation: the digests are rebuilt from the canonical JSON of the record with its own digest member omitted, and the window and step are recomputed from the frames by `productionFrameBoundaryToSeconds` and `denominator / numerator`, the same float expressions the materializer evaluated, so exact equality is the right comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns semantic runtime integrity after caller schema admission, leaving currentness to the sampler and population verifier. Explicit version/interval/rate checks precede hashing; this typed API is not a second unknown-input schema parser.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field is repaired or defaulted, and only `AutoMovieCanonicalJsonError` is translated, because a value the canonicalizer refuses is by definition not a written runtime; any other exception still propagates.

## @evidence contracts/development/common.md#meaningful-documentation

States every property checked, that unencodable values are refused, the one refusal code, that currentness is out of scope, and that browser and builder agree on the digests.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two canonicalizations traverse and serialize the records, sorting each object's K keys with sum(K log K) work, followed by two linear SHA-256 byte passes; the inner effect is serialized twice. The remaining work includes one logarithmic rate reduction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Not cached: callers hold mutable runtime records with no version token, so a previous verdict on the same object could be stale; the sampler and the verifier each validate once per entry per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the two canonical strings only during the call and retains nothing.
