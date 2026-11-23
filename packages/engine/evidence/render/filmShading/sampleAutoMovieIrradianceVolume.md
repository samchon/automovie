# src/render/filmShading/sampleAutoMovieIrradianceVolume.ts#sampleAutoMovieIrradianceVolume

## @evidence contracts/development/common.md#meaningful-documentation

Cites the method and states the clamping, the renormalization and the zero case.

## @evidence contracts/development/implementation.md#principled-implementation

Trilinear interpolation over the irradiance volume, with invalid probes dropped and the remaining weights renormalized as the issue requires.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The CPU reference of the shader's probe term, using `autoMovieIrradianceOf` per probe.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback light replaces an all-invalid neighbourhood.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most eight probe evaluations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
