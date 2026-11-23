# src/expression/IAutoMovieBlendshapeChannel.ts#IAutoMovieBlendshapeChannel

## @evidence contracts/development/design.md#principled-representation

validateExpression checks name membership, finite [0, 1] weight and duplicate channels. applyExpression overwrites the preset-expanded weight for the same name, clamps finite weights and maps nonfinite weights to zero before addressing existing morph targets or supplied sinks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A name and a weight are the whole control atom; ordering, layering over the preset and interpolation belong to `IAutoMovieExpression` and its consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A weight outside the range is reported by validation instead of being silently clamped at authoring time; the viewer's clamp only guards rendering of an unvalidated value.

## @evidence contracts/development/common.md#meaningful-documentation

States what a list of channels represents, the validator's three refusals, and the replace-not-add rule over the preset; members give the closed name menu and the weight's range and endpoints.
