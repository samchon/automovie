# src/scene/filmShading/IAutoMovieFilmIndirectRenderer.ts#IAutoMovieFilmIndirectRenderer

## @evidence contracts/development/design.md#principled-representation

The structural renderer surface the indirect stage drives, the film response surface plus clear and read-back members for the bake.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`AutoMovieFilmIndirectStage` and `bakeAutoMovieFilmProbes` read it; the real `WebGLRenderer` satisfies it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bake members are optional so occlusion can run over a recording renderer; their absence is refused by the bake with an error, not hidden.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's role and why the bake members are optional.
