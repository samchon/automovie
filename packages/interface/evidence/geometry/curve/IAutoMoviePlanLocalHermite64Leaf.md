# src/geometry/curve/IAutoMoviePlanLocalHermite64Leaf.ts#IAutoMoviePlanLocalHermite64Leaf

## @evidence contracts/development/design.md#principled-representation

Normalized u,t bounds address the original interval while the restricted grid uses its own unit-square chart; error is in millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieLocalHermite64 creates leaves consumed by tessellation and per-triangle face attribution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The stored error is a binary64 evaluation of a Taylor estimate, not an outward-rounded certificate or source-fidelity measurement.

## @evidence contracts/development/common.md#meaningful-documentation

States grid parameterization, physical station conversion, estimate formula and patch identity scope.
