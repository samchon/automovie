# src/scene/medium/buildAutoMovieMediumShader.ts#buildAutoMovieMediumShader

## @evidence contracts/development/implementation.md#principled-implementation

Single scattering by Max (1995): surface radiance times `exp(−σt s)` plus a 64-step midpoint-style sum of `exp(−σt s) σs Δs Σ p(θ) E`, with the first step offset by a 4 × 4 Bayer (1973) dither shifted per accumulation sample, so the steps of neighbouring pixels and samples interleave. `E` follows the meter's laws for a surface facing the light: directional intensity, windowed inverse square with the 0.01 m² floor, a hard spot cone, and Lambert's polygon formula for a panel facing its centre, unclipped. The Henyey-Greenstein phase uses the scattering angle between the light's travel and the direction to the camera. Shadow tests mirror the renderer's own lookups for compare maps, variance moments, plain depth and point cubes, with one tap each. A ray that hits nothing marches to the far plane. Alpha follows from the same march: the medium is a layer of associated colour `L` and opacity `1 − T`, Max's segment opacity, put over the picture by Porter and Duff's `over`, giving alpha `1 − T(1 − a)`, which is 1 for an opaque picture and makes a transparent picture composited over its backdrop the opaque picture in linear light. The graphics plate's alpha is its coverage by contract, so with `uMatte` the in-scattered light is weighted by coverage and alpha passes, which equals the beauty pixel at full coverage.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Code is generated per light signature because GLSL ES 3.00 indexes sampler arrays only with constants; each light's uniforms and term are unrolled.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 64 steps and the dither are the issue's; no light or scene is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the ray, the step and dither rule, the scattering law, each light's irradiance, the shadow tests, the panel limit and the alpha rule of a transparent picture and of the coverage matte.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per pixel 64 steps times L lights, each a constant-cost term and at most one shadow lookup; the source grows linearly with L.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pass caches the compiled program by signature; generation itself is cheap.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a string and retains nothing.