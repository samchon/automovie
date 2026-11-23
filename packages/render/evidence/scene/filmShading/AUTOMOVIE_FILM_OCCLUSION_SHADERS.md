# src/scene/filmShading/AUTOMOVIE_FILM_OCCLUSION_SHADERS.ts#AUTOMOVIE_FILM_OCCLUSION_SHADERS

## @evidence contracts/development/design.md#principled-representation

GLSL ES 3.00 sources of the horizon search and its depth-aware blur, each a full-frame fragment program over the prepass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`AutoMovieFilmIndirectStage` compiles both; the search's slice integral mirrors `autoMovieSliceVisibility`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Slice count, step count, the 4 × 4 pattern and the 5 % depth tolerance of the blur are fixed parts of the estimator; nothing names a scene.

## @evidence contracts/development/common.md#meaningful-documentation

States the cited method, the rotation pattern, the step rule, the blur's period and tolerance and the determinism of every fragment.
