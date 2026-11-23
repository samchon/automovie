# src/render/filmShading/projectAutoMovieIrradianceProbe.ts#projectAutoMovieIrradianceProbe

## @evidence contracts/development/common.md#meaningful-documentation

Cites the method, states the exact texel solid angle, the convolution constants and their origin, the order-2 error, the validity rule and the throws.

## @evidence contracts/development/implementation.md#principled-implementation

Monte Carlo-free quadrature of radiance times the basis over exact cube-texel solid angles, then Ramamoorthi and Hanrahan's band-wise clamped-cosine convolution; the faces' own frames give each texel's direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the projection; the basis and the evaluation are separate shared functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quarter threshold is the issue's; no probe or scene is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(6 × size²) with nine products per texel.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure; the renderer reuses whole bakes by revision.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond its result.
