# src/motion/cubicBezierEasing.ts#cubicBezierEasing

## @evidence contracts/development/implementation.md#principled-implementation

Solves cubic x(s)=clamped progress with at most eight Newton steps then, when the x residual remains at least 1e-5, a bracketed crossing on [0, 1] to the width 32 bisections leave (false position, then bisection); CSS-legal x controls make x(s) monotone, while finite y controls may produce intentional overshoot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The local cubic and derivative share Horner-form coefficients; residual-based fallback stays with this one inverse-easing owner rather than changing the motion sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite progress or controls throw; the 1e-6 derivative cutoff and 1e-5 residual select a bounded numerical fallback, while CSS x-domain admission remains validateMotion's caller premise.

## @evidence contracts/development/common.md#meaningful-documentation

Gives fixed endpoints, clamped progress, CSS x-domain premise, finite y overshoot and Newton/bisection method.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-degree Horner evaluation inside fixed eight/32 iteration bounds gives constant time and scalar storage, without constructing sampled curve tables.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The same control values serve cubic and derivative evaluation within one inversion; no cache assumes mutable control tuples remain unchanged between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a numeric eased progress escapes; all coefficients and search bounds are call-local with no handles or retained tables.
