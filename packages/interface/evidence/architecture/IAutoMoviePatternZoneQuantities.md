# src/architecture/IAutoMoviePatternZoneQuantities.ts#IAutoMoviePatternZoneQuantities

## @evidence contracts/development/design.md#principled-representation

Per-zone sums over that zone's placements, with net region area as the region area minus its intersection with each exclusion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only figures meaningful per zone; ratios and joint figures live on the totals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zone that laid nothing still gets a record, rather than being omitted, so the list matches the declaration.

## @evidence contracts/development/common.md#meaningful-documentation

States one record per zone in declaration order, the net-area rule, which figures exist only on totals, and the units.
