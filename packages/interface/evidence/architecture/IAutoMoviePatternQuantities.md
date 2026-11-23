# src/architecture/IAutoMoviePatternQuantities.ts#IAutoMoviePatternQuantities

## @evidence contracts/development/design.md#principled-representation

Totals sum per-zone records; waste subtracts covered from consumed and joint area subtracts covered from net region. These are binary64 polygon measurements and accounting formulas, not exact-real area identities or independent physical coverage proofs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pattern totals plus the zone records in one object, so a caller reports either level without summing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The joint length assumes a tiling program and is stated as such rather than corrected for gaps, and an overlap appears as a negative joint area rather than being clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States how totals relate to zones, why waste includes punched area, what joint area counts and when joint length is meaningful, and the units and ranges of each figure.
