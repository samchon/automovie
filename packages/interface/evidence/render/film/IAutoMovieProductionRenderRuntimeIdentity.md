# src/render/film/IAutoMovieProductionRenderRuntimeIdentity.ts#IAutoMovieProductionRenderRuntimeIdentity

## @evidence contracts/development/design.md#principled-representation

Content addressing needs every runtime input that can change captured or encoded bytes, so the record carries a digest of the declared viewer and package inputs, the dialogue runtime digest, the full capture identity and the encoder identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Capture facts reuse the interface's `IAutoMovieCaptureRuntimeIdentity` and encoder facts live in `IAutoMovieProductionEncoderIdentity`, so this record only joins them with the two job-wide digests.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The protocol literal is the schema version and the only fixed value; null for the dialogue runtime is the documented silent-production state, not a fallback.

## @evidence contracts/development/common.md#meaningful-documentation

The doc says why every field reaches the chunk ids, which fields the planner validates, and each member states what it identifies and what null means.
