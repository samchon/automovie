# src/scene/flame/createAutoMovieFlameMaterial.ts#createAutoMovieFlameMaterial

## @evidence contracts/development/common.md#meaningful-documentation

States the radiance units, the blending, the depth policy, which faces a closed flame and an ember draw and why, the soft-edge patch and its provisional exponent.

## @evidence contracts/development/implementation.md#principled-implementation

An unlit basic material outputs colour in the renderer's linear radiance units; additive blending without depth writes lets the flame glow over what is behind it. Additive blending sums every face a ray crosses, so a closed outward-wound flame draws its front faces only and an ember's open disc both faces, each ray adding the luminance once rather than twice through a closed shell; scaling by |n·v|^1.5 fades the side-on edge of the shell so it reads as a volume.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One material per flame through the shared shader patch helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The exponent is a stated look choice, not tuned to a test. The face choice follows the mesh's topology, closed or one open sheet, not a scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

One material and one patch per flame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each flame owns its material because luminance differs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new material the caller disposes.
