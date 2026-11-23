# src/fluid/IAutoMovieFluidGrid.ts#IAutoMovieFluidGrid

## @evidence contracts/development/design.md#principled-representation

A uniform axis-aligned rectangular lattice, which the solver's finite differences, `fluidSurfaceGeometry`'s centred vertices and `validateWaterFeatures`' basin test all address by `origin + (index + 0.5) * cell` with no per-cell geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two counts, two cell sizes and one corner fully determine every cell, so no rotation, cell list or variable spacing is stored that the current solver could not use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record carries no rotation or per-cell offset the solver would ignore; an irregular basin is expressed through `solid` cells and checked against its space by `validateWaterFeatures`, not approximated by a transformed grid.

## @evidence contracts/development/common.md#meaningful-documentation

States each cell's world span, where its vertex sits, and the cell cap; members give the axis, units, integer and positivity rules, and the two roles of `origin`.
