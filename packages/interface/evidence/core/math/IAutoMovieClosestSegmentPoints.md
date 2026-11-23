# src/core/math/IAutoMovieClosestSegmentPoints.ts#IAutoMovieClosestSegmentPoints

## @evidence contracts/development/design.md#principled-representation

Records the minimiser of the constrained quadratic `|r + s·u − t·v|` over the unit square that `closestPointsBetweenSegments` solves; the distance is measured between the two returned points, so the three fields always agree.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two witness points and their distance, what body collision and convex separation read; the segment parameters stay internal because no consumer needs them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A plain result record with no caller-specific field; the tie rule is a canonical choice applied to every input.

## @evidence contracts/development/common.md#meaningful-documentation

States which segment each point lies on, the unit, ownership, the tie rule, and that the values are rounded witnesses rather than a certified bound.
