# src/scene/surfaceGraphic/buildAutoMovieSurfaceGraphicKey.ts#buildAutoMovieSurfaceGraphicKey

## @evidence contracts/development/common.md#meaningful-documentation

States the face mesh and why a null background still draws one, the render order, the depth policy, each image fit and resource ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The face covers the whole surface so the mask pass paints it whatever the layers hold; layers stack by rising render order with no depth writes, from an order far below every other blended mesh's, because a graphic lies on an opaque face that already hides what is behind it, so a flame or a glass in front draws over the graphic; contain and cover compare the image's pixel aspect with the box's metric aspect and either shrink the quad or narrow the texture window, centred.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key's group; the preparer owns tracks, frames, images and time.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No polygon offset or z step separates layers.

## @evidence contracts/development/implementation.md#efficient-algorithms

One quad and one material per layer plus the face.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each key is built once at preparation; the applier only toggles visibility.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every geometry and material is pushed to the caller's owned list as it is made, so a later failure still releases it.
