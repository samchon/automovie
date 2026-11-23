# src/fluid/IAutoMovieFluidBoundaries.ts#IAutoMovieFluidBoundaries

## @evidence contracts/development/design.md#principled-representation `simulateFluidDomain` consults `xMin` and `xMax` for the outermost x faces of every row and `zMin` and `zMax` for the outermost z faces of every column, the only faces with a missing neighbour cell.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four named fields, one per axis-aligned edge of the rectangular lattice, need no per-face list because every face on one edge shares its condition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No edge has a default; all four are required, so an author states the condition of each rim instead of the solver assuming a wall.

## @evidence contracts/development/common.md#meaningful-documentation

States that edges are independent with an example, the validator's refusal, and how solid cells relate; members say which faces each edge governs by column or row index.
