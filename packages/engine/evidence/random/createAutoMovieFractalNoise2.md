# src/random/createAutoMovieFractalNoise2.ts#createAutoMovieFractalNoise2

## @evidence contracts/development/common.md#meaningful-documentation

Cites Perlin 1985 for the sum of octaves, states the frequency doubling, the amplitude ratio, the normalization and why it keeps [-1, 1], how each octave is seeded and why, where the domain bound applies, and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Octave `o` samples its own single-octave noise at `2^o` times the point with weight `roughness^o`; dividing by the sum of the weights bounds the result by the largest octave magnitude, one. Octave 0 keeps the base seed, so one octave equals the single-octave noise; the others use derived streams, because sharing one lattice would make every octave vanish at the origin together. Coordinates are admitted at the finest octave's scale, which is the only octave that can leave the lattice bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes `createAutoMovieGradientNoise2` and the shared admissions; it owns only the octave weights and seeds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The normalization is the exact sum of the weights; no constant is tuned and no input is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction derives one seed and parses one stream per octave. Each sample costs `octaves` single-octave samples. Frequencies and weights are accumulated by multiplication rather than powers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The per-octave samplers and the weight sum are built once and shared by every sample from the returned sampler.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sampler retains one single-octave sampler per octave and three numbers, released with it; samples grow nothing.
