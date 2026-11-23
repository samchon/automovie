# src/geometry/IAutoMovieWallOpening.ts#IAutoMovieWallOpening

## @evidence contracts/development/design.md#principled-representation

An origin corner plus a positive size gives the cut lines the wall builder partitions at, and its exact sums are the same doubles adjacent cells share, so cells around an opening weld without rounding gaps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five fields, an identity for diagnostics and one rectangle, because the lattice wall can cut only rectangles; arbitrary outlines belong to region extrusion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Overlapping or corner-meeting openings are refused rather than merged or nudged apart, so the wall never emits a pinched or double-cut solid.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and origin corner, every refusal the builder applies, and the producer that maps built openings onto it.
