# src/physics/IAutoMovieCompileImpactEffects.ts#IAutoMovieCompileImpactEffects.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Documents receipt authority, geometric impulse estimates, film timing and explicit effect budgets.

## @evidence contracts/development/design.md#principled-representation

Contact impulses are N s, sample clocks seconds, transport speed m/s and particle density particles per N s; the recipe owns appearance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileImpactEffects consumes canonical receipts and effect recipes, producing the existing effect stream rather than a material preset.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Geometry-only receipts require explicit impulse estimates, and exceeding maximumEffects is refused instead of dropping authored effects.
