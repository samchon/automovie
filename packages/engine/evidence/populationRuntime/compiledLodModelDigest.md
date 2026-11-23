# src/populationRuntime/compiledLodModelDigest.ts#compiledLodModelDigest

## @evidence contracts/development/implementation.md#principled-implementation

Hash canonical JSON v2 of the referenced `IAutoMovieModel` group, so parts, skeleton and materials all enter the identity; absent and unencodable references hash distinct explicit markers. Those markers identify a failure spelling rather than claim a digest of actual model content.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One browser-safe digest owner is shared by both compact population compilers and reads the model group a film references directly, with no registry in between.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing and unencodable markers are explicit kernel identity policy, not a substitute model or content-validity verdict; callers must perform any model admission they require before compilation.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify SHA-256 canonical bytes, missing/unencodable markers and the fact that the kernel catches encoding refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Model lookup is map-based; canonicalization and SHA processing take O(B) work/storage in encoded model bytes, or constant-size marker bytes on fallback, so a mesh-heavy group costs its full encoded size per referencing tier.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both compilers use the same canonicalizer/digest implementation; mutable model records preclude retaining a digest by object identity alone.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Encoded bytes and hash state are call-local; only the returned string survives, with no Node handle or host registry retained.
