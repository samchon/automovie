# src/scene/surfaceGraphic/prepareAutoMovieSurfaceGraphics.ts#prepareAutoMovieSurfaceGraphics

## @evidence contracts/development/common.md#meaningful-documentation

States the root name and mark, the parenting and lift, per-key groups, image decoding order and orientation, the refusals and the handle's applier and disposal.

## @evidence contracts/development/implementation.md#principled-implementation

Parenting each root to the node's model object at the affordance frame makes the graphic inherit placement, object motion and carriage exactly as the prop's parts do; the 0.5 mm lift along the frame normal separates the face from the case in depth; the applier samples each track with the engine's key sampler, so every frame depends on its time alone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Track resolution, image decoding and mounting live here; key geometry is built by buildAutoMovieSurfaceGraphicKey.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unresolved node, surface or image rejects instead of drawing at the origin or skipping a layer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in tracks, keys and layers at preparation; apply is a binary search per track plus a visibility toggle per key.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A distinct image decodes once and is shared by every layer that names it, keyed by model for carried images and by path for project assets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The handle owns roots, geometries, materials and textures until dispose, which is idempotent; a failed preparation releases what it made before rejecting.
