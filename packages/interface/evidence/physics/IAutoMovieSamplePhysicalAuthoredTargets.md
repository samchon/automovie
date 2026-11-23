# src/physics/IAutoMovieSamplePhysicalAuthoredTargets.ts#IAutoMovieSamplePhysicalAuthoredTargets.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

Explains one authored cache interval and value-aware ownership of per-bone interpolation coefficients.

## @evidence contracts/development/design.md#principled-representation

step/rate locates a local-second interval; from/targets contain world-metre poses and each sample takes a dimensionless fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

samplePhysicalAuthoredTargets owns the per-bone map separately from fitted balance plans and reuses unchanged endpoint coefficients.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Before/after references are checked by scalar values as well as identity, so mutating an endpoint cannot justify reusing stale coefficients.
