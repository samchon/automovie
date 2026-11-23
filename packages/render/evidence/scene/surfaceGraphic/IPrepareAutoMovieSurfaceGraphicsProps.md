# src/scene/surfaceGraphic/IPrepareAutoMovieSurfaceGraphicsProps.ts#IPrepareAutoMovieSurfaceGraphicsProps

## @evidence contracts/development/common.md#meaningful-documentation

States what each field supplies, who owns the loaded textures and what an absent loader refuses.

## @evidence contracts/development/design.md#principled-representation

The admitted shot, its scene and models describe what to draw; the node resolver and loader are the host's seams to its mounted objects and its image I/O.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by prepareAutoMovieSurfaceGraphics; render performs no I/O of its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shot is narrowed to the two fields read, so a test or host need not build a whole shot.

# src/scene/surfaceGraphic/IPrepareAutoMovieSurfaceGraphicsProps.ts#IPrepareAutoMovieSurfaceGraphicsProps.resolveNode

## @evidence contracts/development/common.md#meaningful-documentation

States what the resolver returns for a scene node and that the graphic is parented to its object.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.

# src/scene/surfaceGraphic/IPrepareAutoMovieSurfaceGraphicsProps.ts#IPrepareAutoMovieSurfaceGraphicsProps.readFontAsset

## @evidence contracts/development/common.md#meaningful-documentation

States which font sources the reader serves, by which path, and what its absence refuses.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member signature has no body; the function that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member signature has no body; the function that implements it answers.
