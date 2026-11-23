# src/scene/filmShading/bakeAutoMovieFilmProbes.ts#bakeAutoMovieFilmProbes

## @evidence contracts/development/common.md#meaningful-documentation

States what each cube draws and excludes, the back-face pass, what is restored, the one-bounce rule and the throw.

## @evidence contracts/development/implementation.md#principled-implementation

Six 90° faces at the probe render the static layer's lit radiance in linear float with no background, so the projection integrates only the set's light; a double-sided back-face render marks texels inside solids.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rendering and read-back live here; projection, grid and validity belong to the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bake reads no earlier bake; nothing is cached inside it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twelve renders and two 192 × 32 read-backs per probe; the stage runs it only when the request's key changes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

None inside; the stage reuses whole bakes by key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Its target and back-face material are created per bake and disposed in `finally`.
