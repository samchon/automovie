# src/random/createAutoMovieGradientNoise2.ts#createAutoMovieGradientNoise2

## @evidence contracts/development/common.md#meaningful-documentation

Cites Perlin 1985 and 2002, states the value range, the lattice zeros and the continuity, the corner-index mapping with its one-to-one and range argument, the proof of the single-octave bound, the scale and why the clamp exists, and the coordinates each refusal names.

## @evidence contracts/development/implementation.md#principled-implementation

Perlin's gradient lattice: four corner dot products of a unit gradient with the offset, blended by the quintic fade. A gradient's angle is the corner's first 32-bit word of the counter stream scaled to `[0, 2 pi)`, so gradients are uniform on the circle. The index `(i + B) N + (j + B)` with `N = 2B + 2` is a two-digit mixed-radix number whose digits lie in `[0, N)` for every corner of an admitted point, so it is one-to-one and at most `N^2 - 1 < 2^53`. The bound `sqrt(2)/2` follows from Jensen's inequality over the nonnegative fade weights and `fade(t) <= t` on `[0, 1/2]`, as the doc comment derives; the clamp only removes rounding past one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The factory binds the stream once and returns a sampler; coordinate admission and the fade are shared helpers, and the corner read is one closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scale is the proven bound's reciprocal, not a fitted factor, and the domain bound follows from the stream's index capacity; no point or seed is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each sample costs four Philox blocks, four sine and cosine pairs and constant arithmetic, with no allocation beyond the blocks. Gradients are recomputed per sample rather than stored, so memory stays constant over unbounded domains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stream is parsed once per sampler and shared by every sample; gradients are not cached because the stream is pure and caching would retain memory that grows with the sampled area.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned sampler retains only its stream and two numbers, released with the sampler; no sample grows retained state.

