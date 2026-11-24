# src/scene/filmShading/AutoMovieFilmIndirectStage.ts#AutoMovieFilmIndirectStage

## @evidence contracts/development/design.md#principled-representation

A stateful renderer stage owning the prepass, search and blur targets of one raster and the uniforms the patched materials share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host owns one per page; `draw`, `uniforms` and `dispose` are its surface, and `uniforms` exists so the gate is observable.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It wraps the beauty callback instead of reaching into the response stage, so the camera response and the indirect light stay separate owners.

## @evidence contracts/development/common.md#meaningful-documentation

States the steps of a draw, the no-shading path, what is restored, the per-frame independence and the target lifetime.

# src/scene/filmShading/AutoMovieFilmIndirectStage.ts#AutoMovieFilmIndirectStage.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, the refusal before drawing and that the beauty pass runs inside it.

## @evidence contracts/development/implementation.md#principled-implementation

A depth and view-space normal prepass at the beauty raster gives the horizon search the positions and normals ground-truth-based ambient occlusion needs; display overlays are left out of it because they state no scene light and are drawn after the response, so they occlude nothing, and so are blended and additive meshes, a flame or a glass, because they cover nothing behind them and would otherwise give the wall behind a candle flame the flame's horizon. The blur covers the rotation pattern's period.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, patching, the passes and the gated beauty call run in that order; the response stage remains the beauty pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every target is refilled each draw; nothing is reused from an earlier frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scene prepass and two full-frame passes per draw, each fragment reading 4 × 8 × 2 depth texels in the search and 16 in the blur.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Targets are kept while the raster is unchanged; their contents are not reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stage holds three render targets and a depth texture for one raster, replaced when the raster changes and released by `dispose`.

# src/scene/filmShading/AutoMovieFilmIndirectStage.ts#AutoMovieFilmIndirectStage.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what it releases.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes every GPU resource the stage created.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One release path shared with raster changes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is left to garbage collection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Not applicable beyond the release itself.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After it the stage holds no GPU resource.
