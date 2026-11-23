# src/production/sound/IAutoMovieDialogueExpressionLayers.ts#IAutoMovieDialogueExpressionLayers

## @evidence contracts/development/design.md#principled-representation

sampleAutoMovieDialogueExpression preserves the authored expression reference and derives only a closed mouth preset/intensity pair; rest and frames outside the joined half-open ranges produce neutral at zero intensity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two explicit layers let a consumer compose mouth motion without replacing the authored emotion; this record does not itself apply either layer to an actor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing active range produces rest, without inventing an actor, emotion or audible-arrival offset; actual actor consumption remains unwired in the repository.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the borrowed authored reference, fresh mouth pair, closed preset and binary intensity policy rather than promising a merged expression.
