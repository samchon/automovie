# src/production/IAutoMovieProductionRenderLayer.ts#IAutoMovieProductionRenderLayer

## @evidence contracts/development/design.md#principled-representation `sourceFrame` is the segment's `sourceInFrame` plus the integer offset into the segment, and during a dissolve the outgoing layer reads its tail ending at `sourceOutFrame`; the weight is that offset over the transition length, so the layer is an exact integer sample rather than a resampled time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields, which shot, which of its frames and how much of it, are all a compositor needs; the transition kind is not repeated because the layer count and weights already encode it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Weights come only from the transition's frame offset, never from a shot id or a pass, and a pass that cannot blend selects a layer through `productionRenderLayersForPass` instead of receiving a rewritten record.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and both consumers, how guide passes treat weights, and for each field its owner, its integer and shot-local frame basis, and its range.
