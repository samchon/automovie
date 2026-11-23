# src/math/quaternionInterpolationCriticalRatios.ts#quaternionInterpolationCriticalRatios

## @evidence contracts/development/implementation.md#principled-implementation

Spherical components are A cos(theta*t)+B sin(theta*t), with derivative roots atan2(B,A) modulo pi. Differentiating normalized lerp (a_i+t*d_i)/sqrt(a·a+2t*a·d+t²*d·d) leaves a linear numerator with one root. Finite nearly-unit keys admitted by track validation and shorter-arc negation keep normalization positive; admission tolerances and ordinary floating rounding remain in the curve and roots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns stationary ratios for the existing interpolation law; the shared dot threshold matches Quaternion.slerp while film admission owns clocks, clip authority and profiles. No renderer or sampled grid is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every component follows the same derivative without fixture or profile cases; endpoint negation and the near-parallel boundary follow the sampler, while boundary or outside roots are not clamped into interior samples.

## @evidence contracts/development/common.md#meaningful-documentation

States finite admitted-key premises, shorter-arc representation, branch equality, boundary ownership and floating precision; the result contains distinct ratios strictly between zero and one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work over four components gives at most four distinct roots, without duration-dependent density or iterative search; branch coefficients and dot products are shared across components.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computes one current endpoint pair and coordinates no requests or effects; no result is cached across mutable tracks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds two fixed component arrays and at most four ratios during the call, transfers the result array to its caller and retains no state or resources.
