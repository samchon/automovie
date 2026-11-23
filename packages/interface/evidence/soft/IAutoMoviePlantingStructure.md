# src/soft/IAutoMoviePlantingStructure.ts#IAutoMoviePlantingStructure

## @evidence contracts/development/design.md#principled-representation

growPlanting applies the child list recursively, rescales lengths and radii, builds a perpendicular parent frame and normalizes seeded directional perturbations; growth and pruning control which segments survive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Geometry parameters express the branching law directly; species labels do not select a hidden template.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Validation requires nonzero axes and bounded ratios/jitter. The derivation's zero-direction fallback retains the parent axis instead of introducing a species exception.

## @evidence contracts/development/common.md#meaningful-documentation

Members state depth indexing, metre lengths, dimensionless ratios and recipe-frame vertical bias before placement transforms.
