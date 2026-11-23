# src/scene/medium/buildAutoMovieMediumShader.ts#buildAutoMovieMediumShader

## @evidence contracts/development/implementation.md#principled-implementation

Single scattering by Max (1995): surface radiance times `exp(−σt s)` plus a 64-step midpoint-style sum of `exp(−σt s) σs Δs Σ p(θ) E`, with the first step offset by a 4 × 4 Bayer (1973) dither shifted per accumulation sample, so the steps of neighbouring pixels and samples interleave. `E` follows the meter's laws for a surface facing the light: directional intensity, windowed inverse square with the 0.01 m² floor, a hard spot cone, and Lambert's polygon formula for a panel facing its centre, unclipped. The Henyey-Greenstein phase uses the scattering angle between the light's travel and the direction to the camera. Shadow tests mirror the renderer's own lookups for compare maps, variance moments, plain depth and point cubes, with one tap each. A ray that hits nothing marches to the far plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Code is generated per light signature because GLSL ES 3.00 indexes sampler arrays only with constants; each light's uniforms and term are unrolled.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 64 steps and the dither are the issue's; no light or scene is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the ray, the step and dither rule, the scattering law, each light's irradiance, the shadow tests and the panel limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per pixel 64 steps times L lights, each a constant-cost term and at most one shadow lookup; the source grows linearly with L.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pass caches the compiled program by signature; generation itself is cheap.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a string and retains nothing.