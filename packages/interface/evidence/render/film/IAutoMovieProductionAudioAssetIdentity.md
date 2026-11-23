# src/render/film/IAutoMovieProductionAudioAssetIdentity.ts#IAutoMovieProductionAudioAssetIdentity

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind` makes the WAVE facts present exactly when the asset was decoded, so a consumer narrows by the tag instead of testing optional fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared facts come from `IAutoMovieProductionAudioAssetIdentityBase` and each arm adds only its provenance, reusing the canonical source-format and processing contracts produced by ingest rather than restating them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither arm special-cases an asset; the placeholder arm's fixed format is the sound plan's contract rate and channel count, which `normalizeAudioAssets` enforces.

## @evidence contracts/development/common.md#meaningful-documentation

The doc says what each arm carries, where the WAVE facts come from, which validator refuses a contradiction, and the placeholder format.
