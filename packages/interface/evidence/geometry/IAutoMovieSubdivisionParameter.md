# src/geometry/IAutoMovieSubdivisionParameter.ts#IAutoMovieSubdivisionParameter

## @evidence contracts/development/design.md#principled-representation

Each refinement step halves the parameter square, so a vertex's coordinates are the dyadic midpoints and centres of its ancestors, exact in binary64 for every practical level; the per-corner split of non-quads is the Ptex sub-face convention.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record per output vertex with the face, an optional sub-face corner and two coordinates, the smallest address that names any point of any polygon's surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shared vertices take the lowest face and sub-face deterministically rather than one chosen per caller.

## @evidence contracts/development/common.md#meaningful-documentation

States both coordinate conventions, the meaning of a null corner, and which face and sub-face a shared vertex reports.
