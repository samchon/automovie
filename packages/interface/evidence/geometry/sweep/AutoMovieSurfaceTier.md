# src/geometry/sweep/AutoMovieSurfaceTier.ts#AutoMovieSurfaceTier

## @evidence contracts/development/design.md#principled-representation

A closed set of level-of-detail names, each a fixed sampling of one surface definition rather than a separately authored mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four names cover stick, low, medium and high detail; counts per tier live on the patches that own them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No tier is derived by decimating another; each samples the definition itself.

## @evidence contracts/development/common.md#meaningful-documentation

States what each tier is for and what stays fixed across shapes and tiers.
