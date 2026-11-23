# src/scene/flame/createAutoMovieFlameMaterial.ts#createAutoMovieFlameMaterial

## @evidence contracts/development/common.md#meaningful-documentation

States the radiance units, the blending, the depth policy, the soft-edge patch and its provisional exponent.

## @evidence contracts/development/implementation.md#principled-implementation

An unlit basic material outputs colour in the renderer's linear radiance units; additive blending without depth writes lets the flame glow over what is behind it; scaling by |n·v|^1.5 fades the side-on edge of the shell so it reads as a volume.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One material per flame through the shared shader patch helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The exponent is a stated look choice, not tuned to a test.

## @evidence contracts/development/implementation.md#efficient-algorithms

One material and one patch per flame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each flame owns its material because luminance differs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new material the caller disposes.
