# src/geometry/IAutoMovieMeasureModelCrossings.ts#IAutoMovieMeasureModelCrossings.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

The optional withinParts flag requests self-crossing observations in addition to model-part pairs. Omission disables self-pairs; a crossing report remains an observation rather than a model acceptance verdict.

## @evidence contracts/development/design.md#principled-representation

The optional withinParts flag requests self-crossing observations in addition to model-part pairs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieModelCrossings owns transformation into the common model frame and strict mesh crossing queries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omission disables self-pairs; a crossing report remains an observation rather than a model acceptance verdict.
