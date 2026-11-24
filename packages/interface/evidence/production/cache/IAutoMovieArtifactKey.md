# src/production/cache/IAutoMovieArtifactKey.ts#IAutoMovieArtifactKey

## @evidence contracts/development/design.md#principled-representation

Represents the constructive-trace key of one stage: stage name and implementation version, toolchain identities and declared input digests, all as strings so the key text is exact. Records are unordered, so two callers listing the same pairs in another order compose the same key; empty strings and duplicate meaning across records remain the caller's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine owns the generic key because every stage cache (Render's frame capture, a production's figure or bake cache) shares it; the four members are exactly what composeAutoMovieArtifactKey hashes and none is consumer-specific.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No stage, film or tool is named in the type; consumers enter their variation as record data.

## @evidence contracts/development/common.md#meaningful-documentation

States what belongs in each member, why the toolchain is separate, and how upstream digests give early cutoff.
