# src/geometry/sweep/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage

## @evidence contracts/development/design.md#principled-representation

Positions plus face-varying UVs make the standard subdivision cage, and the published `(patch, s, t)` corner coordinates are the shared chart that links tiers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subdivision input is the engine's own cage record, so sampling adds only what tiers, rings and fitting need beside it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Targets and pins are reported beside the fitted controls, so a caller can measure the fit rather than trust it.

## @evidence contracts/development/common.md#meaningful-documentation

States what stays fixed within a tier, what the coordinates are and how tiers are linked.

# src/geometry/sweep/IAutoMovieSurfaceCage.ts#IAutoMovieSurfaceCage.IPatch

## @evidence contracts/development/design.md#principled-representation

A patch's grid is its row and column counts and its faces in row-major order, which is all the chart inversion needs; a band that is no grid says so and is inverted face by face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three numbers and one index list per patch; the faces themselves live once in the cage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts are the tier's declared counts, never inferred from positions.

## @evidence contracts/development/common.md#meaningful-documentation

States the row-major face order and how face `(i, j)` is found.
