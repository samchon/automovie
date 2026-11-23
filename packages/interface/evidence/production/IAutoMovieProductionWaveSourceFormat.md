# src/production/IAutoMovieProductionWaveSourceFormat.ts#IAutoMovieProductionWaveSourceFormat

## @evidence contracts/development/design.md#principled-representation

Each field mirrors a WAVEFORMATEX or WAVEFORMATEXTENSIBLE field the decoder reads, with the layout source and mask recording whether the speakers came from `dwChannelMask` or from the legacy default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record keeps the envelope facts apart from the processing lineage, which lets the render plan validate a source identity separately from the conversion applied to it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed unions constrain each vocabulary independently, while numeric ranges and encoding/precision/channel/layout/GUID relations remain producer invariants checked by the decoder and render wave-identity validator, not guarantees of this erased type.

## @evidence contracts/development/common.md#meaningful-documentation

The comments state where each fact comes from, which header spelling sets the mask and GUID, and that the literal unions are the supported subset.
