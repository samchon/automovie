# src/render/draw/IAutoMovieDrawnPass.ts#IAutoMovieDrawnPass

## @evidence contracts/development/design.md#principled-representation

AutoMovieDrawSession.frame emits records in requested pass order, using the same second, raster and film camera for each; picture storage belongs to the caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieDrawSession.frame returns the pass and picture with any diagnostics supplied by that draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

AutoMovieDrawSession.frame emits records in requested pass order, using the same second, raster and film camera for each; picture storage belongs to the caller.

## @evidence contracts/development/common.md#meaningful-documentation

One decoded pass of a sampled subject frame. The prose and members document how AutoMovieDrawSession.frame interprets and admits these values.
