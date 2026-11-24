# src/scene/filmResponse/IAutoMovieFilmResponseRenderer.ts#IAutoMovieFilmResponseRenderer

## @evidence contracts/development/design.md#principled-representation

The members are the renderer state the stage changes and restores: the current target, the renderer's own curve and exposure, the clear policy and shadow-map updates, plus drawing itself; the optional `shadowMap.enabled` is read by the medium pass so a recording double without it marches unshadowed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what AutoMovieFilmResponseStage reads and sets; the draw host passes its WebGLRenderer and the inspector's renderer interface extends it, so both hosts satisfy it as they stand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Structural rather than the whole renderer so the stage's ordering and restoration are checkable without a GPU; it narrows nothing the stage needs.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is and that the canvas is the null target.
# src/scene/filmResponse/IAutoMovieFilmResponseRenderer.ts#IAutoMovieFilmResponseRenderer.render

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn and where.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the renderer that implements it answers.
# src/scene/filmResponse/IAutoMovieFilmResponseRenderer.ts#IAutoMovieFilmResponseRenderer.getRenderTarget

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and that null is the canvas.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the renderer that implements it answers.
# src/scene/filmResponse/IAutoMovieFilmResponseRenderer.ts#IAutoMovieFilmResponseRenderer.setRenderTarget

## @evidence contracts/development/common.md#meaningful-documentation

States what the call selects and what null selects.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the renderer that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the renderer that implements it answers.