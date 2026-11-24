# src/material/autoMovieProceduralNoise.ts#autoMovieProceduralNoise

## @evidence contracts/development/common.md#meaningful-documentation

Cites Perlin 2002, states the gradient set, the hash that selects it, the fade, the clamp and the GPU counterpart.

## @evidence contracts/development/implementation.md#principled-implementation

Perlin's improved noise with the permutation table replaced by the PCG3D lattice hash, which has no period within the 32-bit lattice and evaluates identically in GLSL. Zero at lattice corners and C2 continuity follow from the construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one octave; the fractal sum and the wood displacement build on it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The gradient table and fade are Perlin's; the clamp only bounds rounding.

## @evidence contracts/development/implementation.md#efficient-algorithms

One key hash and eight corner hashes per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The key is hashed once per call and shared by the eight corners; nothing persists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
