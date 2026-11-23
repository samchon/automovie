# src/architecture/IAutoMovieSurfacePattern.ts#IAutoMovieSurfacePattern

## @evidence contracts/development/design.md#principled-representation

The declaration separates the author's module law, a pure generator per zone, from the engine-owned measurement, so a run is a deterministic function of this record and every variant draw is seeded from `seed` and the occurrence id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record per face: zones carry their own module programs and regions, while joint, tolerance, adjacency, minimum piece, grain tolerance and the variant seed are pattern-wide because the neighbour scan reads them across zone borders.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Holds no preset bond or catalogue, because a bond is content; every numeric range is checked by the generator, which throws rather than clamping an out-of-range value.

## @evidence contracts/development/common.md#meaningful-documentation

States why a pattern is not a texture repeat, how transitions are expressed, which declarations throw and which defects become findings, the metre unit, and each member's range, null meaning and role.
