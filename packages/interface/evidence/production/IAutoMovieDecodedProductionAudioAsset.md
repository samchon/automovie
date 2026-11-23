# src/production/IAutoMovieDecodedProductionAudioAsset.ts#IAutoMovieDecodedProductionAudioAsset

## @evidence contracts/development/design.md#principled-representation

Source envelope facts, processing lineage and sample storage remain separate so consumers can compare declared source/output relationships. The Float32Array carries no rate metadata and this record cannot independently prove that its samples were generated at the declared rate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source facts, processing and samples are three named parts of one decoder result instead of separate return paths, and the render package reuses the two nested types as its wave identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The decoder fills repeated source fields and `sourceFormat` from the same parsed values; this structural type neither correlates independently supplied records nor authenticates mutable sample bytes.

## @evidence contracts/development/common.md#meaningful-documentation

The comments state which fields describe the file and which the output, the units of rate and duration, and that samples are finite mono values at the requested rate.

# src/production/IAutoMovieDecodedProductionAudioAsset.ts#IAutoMovieDecodedProductionAudioAsset.IProps

## @evidence contracts/development/design.md#principled-representation

Input bytes remain distinct from requested output rate and diagnostic identity; the decoder admits positive safe-integer rates and WAVE consistency at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decoder reads only these three required fields and owns neither file acquisition nor caching.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default rate, implicit file loading or codec fallback is expressed; unsupported encodings throw.

## @evidence contracts/development/common.md#meaningful-documentation

Members state diagnostic-only path use, byte lifetime, rate units and required explicit input.
