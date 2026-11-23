# src/drawing/IAutoMovieDrawingDesignIndex.ts#IAutoMovieDrawingDesignIndex

## @evidence contracts/development/design.md#principled-representation

Id maps over the design's unique ids, staging from `builtEnvironmentWorldMatrices`, and a tessellation memo keyed by part identity, each valid because the index serves one derivation over an environment that does not change during it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the lookups the drawing, schedule and feature derivations share, as one record passed to every helper instead of each helper scanning the environment itself.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No element, model or boundary is special-cased; a builder-owned model is absent from `models` by definition rather than stubbed.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the producer, the ownership and lifetime, what each member holds, what an absent model means, the staging used, the memo's scope, its failure and the shared-array rule.
