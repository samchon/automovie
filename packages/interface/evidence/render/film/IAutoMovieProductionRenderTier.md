# src/render/film/IAutoMovieProductionRenderTier.ts#IAutoMovieProductionRenderTier

## @evidence contracts/development/design.md#principled-representation

Two independent reductions, a raster scale and an integer frame decimation, describe every cheaper rendering of the same edit while keeping its runtime exact, because decimating by a divisor of the frame count divides the rational frame rate by the same integer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tier is three plain fields, and its admission and its projection live in `normalizeRenderTier` and `resolveProductionRenderTierFrameFormat`, so the record carries no behavior.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The limits of 1 for final and 16 for the proxy step come from the production design's `renderTiers` contract, and no other value is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names the two admitted shapes and their validator, the divisibility rule with its reason, and the projection, and each member gives its range and its final value.
