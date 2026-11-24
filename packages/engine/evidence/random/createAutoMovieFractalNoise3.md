# src/random/createAutoMovieFractalNoise3.ts#createAutoMovieFractalNoise3

## @evidence contracts/development/common.md#meaningful-documentation

Cites Perlin 1985, states the octave frequencies, weights and normalization, the per-octave seeds, where the domain bound applies, and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The three-dimensional form of the two-dimensional fractal sum: octave `o` samples its own lattice at `2^o` times the point with weight `roughness^o`, the sum is divided by the sum of the weights, and coordinates are admitted at the finest octave's scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes `createAutoMovieGradientNoise3` and the shared admissions; it owns only the octave weights and seeds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The normalization is the exact sum of the weights; nothing is tuned or special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction parses one stream per octave; each sample costs `octaves` single-octave samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The per-octave samplers and the weight sum are built once and shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sampler retains one single-octave sampler per octave and three numbers, released with it.
