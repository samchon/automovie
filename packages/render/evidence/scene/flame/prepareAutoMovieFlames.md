# src/scene/flame/prepareAutoMovieFlames.ts#prepareAutoMovieFlames

## @evidence contracts/development/common.md#meaningful-documentation

States the mesh name and parent, the material and the faces it draws, shadow and draw order, how a bound and an unbound flame get luminance, the per-frame reshaping and visibility, how each apply drives a bound flame's light, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Parenting to the model object at the emitter frame makes the flame follow the prop; a bound flame's luminance I_on / Ā makes its mean emitted power track the light's mean intensity; render order −1 sorts it before a lantern's blended globe; the shape is resampled at the exact frame time from the same closed form the light used; a bound flame's light clip is resolved by the engine's resolveShotLighting at the same second and written by applyLightState, the writer every light uses, so the light's flicker and switching reach every host that places the film.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mounting and per-frame application live here, the flame and the light it motivates together so neither can be applied without the other; shape, grid and light resolution stay in the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unresolved prop, emitter, bound light or built light throws instead of drawing at the origin, guessing a colour or leaving the light at its staged intensity.

## @evidence contracts/development/implementation.md#efficient-algorithms

One flame sample per cue per frame, rewriting its buffers in place, and one sample of one clip for one light per bound cue.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each mesh keeps its geometry and material across frames and only rewrites positions and normals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The handle owns meshes, geometries and materials until dispose, which is idempotent; a failed preparation releases what it made.
