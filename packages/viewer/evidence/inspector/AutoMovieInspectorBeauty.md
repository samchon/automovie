# src/inspector/AutoMovieInspectorBeauty.ts#AutoMovieInspectorBeauty

## @evidence contracts/development/design.md#principled-representation

The two film stages the draw page delivers one sample with, held for the mount's life.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mount owns one; `draw` and `dispose` are its surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It runs render's own stages rather than a viewer copy of them, so a paused frame and a delivered single-sample frame cannot drift.

## @evidence contracts/development/common.md#meaningful-documentation

States the stages, what a shaded subject's picture matches, the plain path, the sampled-optics limit and the lifetime.

# src/inspector/AutoMovieInspectorBeauty.ts#AutoMovieInspectorBeauty.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs and that the response stage runs inside the indirect stage.

## @evidence contracts/development/implementation.md#principled-implementation

The order is the draw page's single-sample order: indirect shading measured for the drawn camera, then the response.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One indirect draw wrapping one response draw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The subject's shading and optics are read at the drawn second and admitted by the stages, never assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The stages' own cost; a subject without shading or optics adds nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stages keep their targets across pictures and the indirect stage reuses a probe bake of an equal revision.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stages hold their targets until `dispose`.

# src/inspector/AutoMovieInspectorBeauty.ts#AutoMovieInspectorBeauty.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States that both stages are released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes both stages.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two calls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is left to garbage collection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Not applicable beyond the release itself.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After it the beauty holds no GPU resource.