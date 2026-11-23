# src/random/createAutoMovieGradientNoise3.ts#createAutoMovieGradientNoise3

## @evidence contracts/development/common.md#meaningful-documentation

Cites Perlin 1985 and 2002, states the range, lattice zeros and continuity, the sphere-uniform gradient draw, the three-digit corner index with its one-to-one and range argument, the bound and its scale, and the coordinates each refusal names.

## @evidence contracts/development/implementation.md#principled-implementation

Eight corner dot products blended by the quintic fade along x, then y, then z. A gradient takes its height uniform in [-1, 1] from the block's first word and its azimuth from the second, which is uniform on the unit sphere by Archimedes' hat-box theorem. The index `((i + B) N + (j + B)) N + (k + B)` with `N = 2B + 2` has digits in `[0, N)` for every corner of an admitted point, so it is one-to-one and at most `N^3 - 1`, about 2.25e15, below 2^53. The bound `sqrt(3)/2` follows from the same Jensen argument as in two dimensions with three axes; the clamp only removes rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The factory binds the stream once; one closure reads a corner and one blends an edge, and admission and the fade are the helpers shared with the two-dimensional noise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scale is the proven bound's reciprocal and the domain bound follows from the stream's capacity; no point or seed is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each sample costs eight Philox blocks, eight trigonometric pairs and one square root per corner, and constant arithmetic. Gradients are recomputed rather than stored, so memory stays constant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stream is parsed once per sampler; gradients are not cached because the stream is pure and a cache would grow with the sampled volume.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sampler retains only its stream and three numbers, released with it.

