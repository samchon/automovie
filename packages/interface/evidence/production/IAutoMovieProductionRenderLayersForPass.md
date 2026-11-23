# src/production/IAutoMovieProductionRenderLayersForPass.ts#IAutoMovieProductionRenderLayersForPass.IFrame

## @evidence contracts/development/design.md#principled-representation

Layer weight is a dimensionless blend contribution; sampled film layers are outgoing then incoming. The selector does not numerically validate or normalize beauty weights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionRenderLayersForPass only needs the layers collection and weight, preserving each caller's remaining layer payload through the generic type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The generic preserves actual layer data rather than hiding a platform dependency. Layers must be structured-cloneable; cloning errors propagate and structural passes reject an empty list through reduce.

## @evidence contracts/development/common.md#meaningful-documentation

Weighted sampled layers supplied to beauty or structural pass selection. Layer weight is a dimensionless blend contribution; sampled film layers are outgoing then incoming. The selector does not numerically validate or normalize beauty weights.
