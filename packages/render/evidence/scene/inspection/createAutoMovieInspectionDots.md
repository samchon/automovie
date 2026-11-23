# src/scene/inspection/createAutoMovieInspectionDots.ts#createAutoMovieInspectionDots

## @evidence contracts/development/common.md#meaningful-documentation

States the size rule and its reason, that size ignores distance, the pixel ratio both renderers apply, the buffer layout and sharing, and the depth behaviour.

## @evidence contracts/development/implementation.md#principled-implementation

three.js points are squares of a size in pixels when size attenuation is off, the screen-sized quad the rule asks for; the depth lead is the same view-space lead as the strokes, inserted after three.js's own projection chunk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Geometry, material, then the object flags.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The factor of three is a stated convention tying a point to the stroke, not a size tuned to one picture, and mismatched buffers are refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw call for every point of the object.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every mark builder draws its places through this one factory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The geometry and material are created here and owned by the caller, who disposes both; nothing else is retained.
