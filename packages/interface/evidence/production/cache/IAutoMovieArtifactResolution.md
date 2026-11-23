# src/production/cache/IAutoMovieArtifactResolution.ts#IAutoMovieArtifactResolution

## @evidence contracts/development/design.md#principled-representation

Bytes with their `sha256:` content digest, which is the value a downstream key should declare as its input for early cutoff, and a closed outcome naming whether the store, the computation or both produced them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine owns the result beside its resolver; Render's frame cache and production stage caches read the bytes, the digest for downstream keys and the outcome for their reports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Outcomes are one union rather than flags, so a result cannot claim to be both reused and recomputed.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each outcome and what the digest is for.
