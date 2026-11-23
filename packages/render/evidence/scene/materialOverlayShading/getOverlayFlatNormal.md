# src/scene/materialOverlayShading/getOverlayFlatNormal.ts#getOverlayFlatNormal

## @evidence contracts/development/implementation.md#principled-implementation

Creates one linear 1x1 RGBA normal texture using the conventional nearest eight-bit neutral coordinates and registers it as a material wrapper before returning it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One module singleton supplies the tangent-frame prerequisite to overlay materials without per-material identical texel construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 128/128/255 bytes are a conventional quantized normal, not a measurement or exactly representable zero tangent slope; no scene-specific fallback is selected.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation identifies nominal neutral texel, shared material use and module versus renderer disposal ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

First acquisition allocates four texel bytes and one wrapper; subsequent calls are fixed-time lookup, while each renderer owns its native upload.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All overlay users share the same fixed immutable texel wrapper; they must not mutate it as if it were a private normal map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module strongly retains exactly one DataTexture until module/application lifetime ends, with no explicit reset API; material/native renderer disposal belongs to borrowers and ownership registration is weak metadata rather than cleanup.
