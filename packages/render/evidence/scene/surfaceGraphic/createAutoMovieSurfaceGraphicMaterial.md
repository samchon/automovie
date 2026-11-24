# src/scene/surfaceGraphic/createAutoMovieSurfaceGraphicMaterial.ts#createAutoMovieSurfaceGraphicMaterial

## @evidence contracts/development/common.md#meaningful-documentation

States both emission materials, the radiance and albedo they give, the blending, depth and texture ownership.

## @evidence contracts/development/implementation.md#principled-implementation

An unlit basic material outputs colour times texel in the renderer's linear radiance units, so a white at L cd/m² reads L, the radiance of a Lambertian card of albedo rho under E lux being rho E / pi; a Lambert material gives the printed albedo lit by the scene's photometric lights.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One choice between two material classes from the closed emission union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No exposure or tone factor is folded into the luminance.

## @evidence contracts/development/implementation.md#efficient-algorithms

One material per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Layers own their materials because colours differ per layer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new material the caller disposes; the texture stays with its owner.
