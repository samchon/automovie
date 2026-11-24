# src/render/autoMovieSurfaceGraphicNodeName.ts#autoMovieSurfaceGraphicNodeName

## @evidence contracts/development/implementation.md#principled-implementation

Join the node and surface ids under the surface-graphic: prefix, so the render root of a track and its engine-derived mask claim share one name, which is also the claim id.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The engine owns the convention without importing the render preparer, as it does for soft-body and planting names.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The name follows from the track identity alone; no fixture or colour selects it.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact name, that it doubles as the mask id, and the engine/render boundary it bridges.

## @evidence contracts/development/implementation.md#efficient-algorithms

One concatenation, linear in the two id lengths.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Mask derivation and the render preparer reuse the naming law; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the immutable string escapes.
