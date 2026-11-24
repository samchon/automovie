# src/production/sound/IAutoMovieDialogueExpressionLayers.ts#IAutoMovieDialogueExpressionLayers

## @evidence contracts/development/common.md#meaningful-documentation

States the composition and the range and sum of the weights.

## @evidence contracts/development/design.md#principled-representation

The authored expression and the mouth's viseme weights as two layers, so the mouth layers over emotion without overwriting it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by engine's `sampleAutoMovieDialogueExpression`; render's `applyExpression` takes both layers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The mouth carries weights, not one preset at intensity 0 or 1.
