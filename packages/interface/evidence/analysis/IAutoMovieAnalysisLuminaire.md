# src/analysis/IAutoMovieAnalysisLuminaire.ts#IAutoMovieAnalysisLuminaire

## @evidence contracts/development/design.md#principled-representation

An isotropic point source under the inverse square and cosine laws, `I * cos / r^2`, with occlusion tested by the same convex slab test as the sun, which holds for a fitting small against its distance to the plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Id, position and one intensity, because an isotropic point needs no photometric web or orientation and the engine ships no fitting catalogue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fitting on the workplane contributes nothing and raises a warning instead of a clamped or infinite value, and no fitting type is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the contribution law, the occlusion rule, the coincidence threshold and its once-per-fitting warning, the candela and metre units, and the non-negative finite intensity.
