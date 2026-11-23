# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer

## @evidence contracts/development/design.md#principled-representation

The structural renderer surface the indirect stage drives, the film response surface plus clear and read-back members for the bake.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owner and consumers: `AutoMovieFilmIndirectStage` and `bakeAutoMovieFilmProbes` read it; the real `WebGLRenderer` satisfies it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bake members are optional so occlusion can run over a recording renderer; their absence is refused by the bake with an error, not hidden.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's role and why the bake members are optional.

# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer.getClearColor

## @evidence contracts/development/common.md#meaningful-documentation

States what the call writes into its argument: the renderer's clear colour.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer.getClearAlpha

## @evidence contracts/development/common.md#meaningful-documentation

States what the call returns: the renderer's clear alpha.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer.setClearColor

## @evidence contracts/development/common.md#meaningful-documentation

States which clear colour and alpha the call sets.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer.clear

## @evidence contracts/development/common.md#meaningful-documentation

States which buffers of the current target the call clears.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer.readRenderTargetPixels

## @evidence contracts/development/common.md#meaningful-documentation

States which region of which target the call reads into the buffer.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature of the renderer's structural type has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature of the renderer's structural type has no body; the renderer that implements it answers.
