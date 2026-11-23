# src/scene/surfaceGraphic/IPrepareAutoMovieSurfaceGraphicsProps.ts#IPrepareAutoMovieSurfaceGraphicsProps

## @evidence contracts/development/common.md#meaningful-documentation

States what each field supplies, who owns the loaded textures and what an absent loader refuses.

## @evidence contracts/development/design.md#principled-representation

The admitted shot, its scene and models describe what to draw; the node resolver and loader are the host's seams to its mounted objects and its image I/O.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by prepareAutoMovieSurfaceGraphics; render performs no I/O of its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shot is narrowed to the two fields read, so a test or host need not build a whole shot.
