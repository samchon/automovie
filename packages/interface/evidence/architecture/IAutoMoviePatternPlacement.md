# src/architecture/IAutoMoviePatternPlacement.ts#IAutoMoviePatternPlacement

## @evidence contracts/development/design.md#principled-representation

The module rectangle is clipped to its convex zone region by Sutherland-Hodgman and measured against exclusions by convex clipping, so `area`, `coverage` and `cut` describe the piece as laid; the variant is a seeded draw from the pattern seed, the variant count and the id alone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries identity, provenance, the generated geometry and every derived measurement in one record, so mesh, slot, finish and take-off cite the same occurrence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fully clipped module is absent rather than recorded at zero area, and a punched piece keeps its convex outline with the loss in `punchedArea` rather than a fabricated non-convex shape.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, when a candidate is absent, the variant's dependence, the id format, units, the coverage range with its rounding caveat, the cut cases, and why joints use `outline` and what `punchedArea` means.
