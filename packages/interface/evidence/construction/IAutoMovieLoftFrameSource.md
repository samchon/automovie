# src/construction/IAutoMovieLoftFrameSource.ts#IAutoMovieLoftFrameSource.ISource

## @evidence contracts/development/design.md#principled-representation

The callable source determines intermediate frames; station/value/derivatives verify that a copied layer still represents that source datum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Axis identity and one station jet make geometry ownership visible in the layer record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A stripped or mutated source is invalid, not an instruction to respline; source absence alone selects ordinary layer interpolation.

## @evidence contracts/development/common.md#meaningful-documentation

Same numeric layer copies preserve meaning while sharing the actual immutable axis; JSON cannot serialize that callable and must reconstruct it from the authored tree.
