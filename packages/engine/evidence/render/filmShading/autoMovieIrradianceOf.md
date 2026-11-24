# src/render/filmShading/autoMovieIrradianceOf.ts#autoMovieIrradianceOf

## @evidence contracts/development/common.md#meaningful-documentation

States the series, the units and the possible small negative value.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the nine-term spherical-harmonic series at the normalized direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by the volume sampler and tests; the shader writes the same sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp hides ringing; the value is reported as computed.

## @evidence contracts/development/implementation.md#efficient-algorithms

27 products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
