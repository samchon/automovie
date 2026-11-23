# src/index.ts#AutoMovieTextureCache

## @evidence contracts/development/design.md#principled-representation

Asset-keyed decode promises feed binding-private Texture clones sharing decoded Source pixels; allocation authority records original and clone input history, and disposal drains pending loads before independent retirement attempts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Prime owns asynchronous decoding, resolve supplies synchronous per-binding wrappers and disposal owns shot teardown; allocation receipts keep certification history separate from loading and sampling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unprimed assets, closed caches and foreign or already-issued decoder originals refuse explicitly; failed disposal and detached Source history remain uncertain instead of declaring an empty map physically released.

## @evidence contracts/development/common.md#meaningful-documentation

Explains decoded-source sharing versus binding-private sampler state, renderer-specific native allocation, loader teardown constraints and single-attempt failure-preserving disposal.

# src/index.ts#AutoMovieTextureCache.prototype.prime

## @evidence contracts/development/implementation.md#principled-implementation

Deduplicates non-null binding assets, resolves each against the carried images before the host loader, refuses an id whose origin differs from an earlier prime, waits for every decode outcome and reports all failed asset names; all successful sources are ready for the synchronous resolver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Asset extraction and decodeOnce isolate binding representation and per-asset promise ownership from this batch-coordination method; the carried-image decoder and the host loader are the two interchangeable sources of an original.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rejected asset is reported rather than replaced with an absent texture or silently decoded again under a different binding, and a conflicting origin for one id is refused rather than resolved by prime order.

## @evidence contracts/development/common.md#meaningful-documentation

Explains the asynchronous prerequisite for synchronous material resolution, carried-image precedence, shot-wide id identity and aggregate asset-name failure behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Walks bindings once into a Set and images once into a Map, starts one lookup per distinct asset and examines settled results once, using temporary space linear in distinct assets and images.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

decodeOnce shares the same promise for an asset across overlapping prime calls, including its completed outcome; the recorded origin, equal carried bytes or the host loader, proves the shared decode equivalent, and the cache lifetime fixes the decode context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Pending and completed decoded textures enter shot-owned Maps before loader execution; dispose waits for those promises and retires their successful textures even during interrupted preparation.

# src/index.ts#AutoMovieTextureCache.prototype.resolve

## @evidence contracts/development/implementation.md#principled-implementation

Looks up a primed asset and clones its decoded Texture wrapper while allocation receipts observe both successful and failed copies; shared Source pixels keep binding-local sampling state independent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A bound resolver field can be passed directly to model/material builders while the cache retains clone retirement ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing primed assets and closed-cache use throw rather than returning an untextured substitute for an authored binding.

## @evidence contracts/development/common.md#meaningful-documentation

Explains bound-field use, per-binding wrappers and the distinction between missing authored assets and a legitimately absent map.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one asset Map lookup and one wrapper clone per binding; decoded image bytes are shared, while SDK userData copying follows the source object's metadata size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses decoded Source data but deliberately issues a distinct wrapper for each binding's independent color-space, UV and sampler writes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every issued wrapper enters the shot-owned clone list for disposal; repeated resolves grow that list without a numeric cap until the shot owner closes the cache.

# src/index.ts#AutoMovieTextureCache.prototype.resolveShared

## @evidence contracts/development/implementation.md#principled-implementation

Keys each object binding by the canonical JSON of every field it carries, so a hit returns the wrapper whose binding writes are identical; string bindings and unprimed assets defer to resolve, which issues or refuses as before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A second bound resolver keeps resolve's fresh-wrapper contract for environment and binding-private callers while material builders opt into sharing by passing this field.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field is ignored in the key and slot-dependent legacy bindings are never shared, so no binding receives another binding's colour space, transform or sampler.

## @evidence contracts/development/common.md#meaningful-documentation

States the equality that permits sharing, the legacy-string exception and the environment restriction.

## @evidence contracts/development/implementation.md#efficient-algorithms

One canonical serialization of a small binding record and one Map lookup per call; a miss adds one clone through resolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal bindings, whose wrapper writes are identical, reuse one issued wrapper and therefore one sampler/format/colour-space state; different fields issue a separate wrapper because their native allocation state may differ.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Wrappers issued here stay in the shot-owned list that dispose retires; their population is bounded by the distinct object bindings resolved in the shot plus one per string-binding resolution, not by the number of resolutions.

# src/index.ts#AutoMovieTextureCache.prototype.describeSources

## @evidence contracts/development/implementation.md#principled-implementation

Observes each original decoded texture through readAutoMovieTextureSource, preserving actual extent, format, source identity and allocation authority instead of substituting declared asset dimensions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cache supplies its asset-to-original mapping and delegates texture fact interpretation to the common observer used by resolved environment wrappers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Describing originals does not certify issued environment derivatives; the documentation requires observing the actual resolved clone for that ownership path.

## @evidence contracts/development/common.md#meaningful-documentation

Explains preflight use, original-object tokens, preparation before first issue and the limitation of original facts for environment derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each decoded asset once and allocation authority also checks its issued wrappers; result space is linear in decoded assets rather than image pixels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Texture fields and wrapper history are mutable, so source facts are reobserved instead of cached across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fact records without acquiring textures or native storage; existing Maps remain owned by the cache's shot lifetime.

# src/index.ts#AutoMovieTextureCache.prototype.dispose

## @evidence contracts/development/implementation.md#principled-implementation

Marks the cache closed synchronously and memoizes release, which waits for all decodes and independently retires every distinct issued or decoded wrapper, preserving listener errors and detached-Source uncertainty.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Public closure and shared completion remain in dispose while release owns draining and physical-retirement attempts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed or indeterminate retirement rejects completion; clearing sources cannot serve as proof that earlier GPU allocations were physically freed.

## @evidence contracts/development/common.md#meaningful-documentation

States loader settlement requirements, single-attempt disposal, shared completion identity and preservation of original causes and unknown residency.

## @evidence contracts/development/implementation.md#efficient-algorithms

Promise settlement and Set deduplication visit pending assets plus issued wrappers once; disposal calls scale with distinct texture objects and collect at most their failure causes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Concurrent and repeated close callers receive one disposal promise, including rejection, so native disposal effects are not repeated to obtain a different outcome.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful wrappers leave ownership bookkeeping after all attempts; failed or indeterminate wrappers remain strongly retained as uncertainty, and a loader that never settles leaves teardown pending without a time bound.
