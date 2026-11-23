# src/soft/IAutoMovieSoftBodyBudget.ts#IAutoMovieSoftBodyBudget

## @evidence contracts/development/design.md#principled-representation

softBodyBudget counts row/column, diagonal and second-neighbour constraints from lattice dimensions, then derives two gathers per constraint per iteration and step; travel uses the shortest authored structural rest edge, excluding diagonal and second-neighbour lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The report separates raster triangles, solver constraints and declared seek work so equal counts do not imply equal responsibilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

stateBytes counts six Float64 components per particle only; it excludes working buffers, JavaScript array overhead and device allocations and is not total process memory.

## @evidence contracts/development/common.md#meaningful-documentation

Fields identify counts, bytes, maximum absolute step and the dimensionless travel admission estimate.
