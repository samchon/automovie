# src/scene/medium/AutoMovieFilmMediumPass.ts#AutoMovieFilmMediumPass

## @evidence contracts/development/design.md#principled-representation

One pass per film response stage owns the march target, the copy program and the compiled march programs by light signature.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The stage calls `apply` after each linear render, with its alpha mode, and `dispose` with its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No film or light is named.

## @evidence contracts/development/common.md#meaningful-documentation

States when it acts, what it reads and writes, the dither shift per sample and the shadow-enabling rule.
# src/scene/medium/AutoMovieFilmMediumPass.ts#AutoMovieFilmMediumPass.prototype.apply

## @evidence contracts/development/implementation.md#principled-implementation

Marches into its own target from the linear colour, alpha and depth, then copies colour and alpha back so the rest of the stage reads one target; the alpha mode selects the march's alpha rule, which `buildAutoMovieMediumShader` states. The dither shift is a golden-ratio additive recurrence per sample index, a fixed function of the index.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Light reading, shader generation and drawing are separate functions; the pass owns order, uniforms and state restoration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The renderer's target and clear policy are restored in a finally block; shadow maps are read only when the renderer draws them.

## @evidence contracts/development/common.md#meaningful-documentation

States the in-place effect, the alpha mode, the no-medium case and what is restored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two full-frame passes per linear render, the march dominating at 64 steps per light per pixel.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Compiled programs are reused by light signature, valid because the program text depends only on the kinds and shadow kinds; uniforms are rewritten every draw.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One target per raster and one program per distinct light signature, released by `dispose`.
# src/scene/medium/AutoMovieFilmMediumPass.ts#AutoMovieFilmMediumPass.prototype.dispose

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the target, every program, the copy program and the quad geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One release path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Releases every GPU object the pass made.

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the cached programs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After dispose the pass holds no GPU resource.