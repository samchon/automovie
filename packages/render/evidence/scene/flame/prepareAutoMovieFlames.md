# src/scene/flame/prepareAutoMovieFlames.ts#prepareAutoMovieFlames

## @evidence contracts/development/common.md#meaningful-documentation

States the mesh name and parent, the material, shadow and draw order, how a bound and an unbound flame get luminance, the per-frame reshaping and visibility, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Parenting to the model object at the emitter frame makes the flame follow the prop; a bound flame's luminance I_on / Ā makes its mean emitted power track the light's mean intensity; render order −1 sorts it before a lantern's blended globe; the shape is resampled at the exact frame time from the same closed form the light used.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mounting and per-frame application live here; shape and grid stay in the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unresolved prop, emitter or bound light throws instead of drawing at the origin or guessing a colour.

## @evidence contracts/development/implementation.md#efficient-algorithms

One flame sample per cue per frame, rewriting its buffers in place.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each mesh keeps its geometry and material across frames and only rewrites positions and normals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The handle owns meshes, geometries and materials until dispose, which is idempotent; a failed preparation releases what it made.
