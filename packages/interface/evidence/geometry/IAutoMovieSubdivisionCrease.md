# src/geometry/IAutoMovieSubdivisionCrease.ts#IAutoMovieSubdivisionCrease

## @evidence contracts/development/design.md#principled-representation

Per-edge sharpness with uniform decrement and fractional blending is the semi-sharp crease model of DeRose, Kass and Truong (1998); the infinite value 10 is the OpenSubdiv constant, so authored values mean the same as in that reference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An edge is named by its two cage vertices, the identity the cage already has, instead of an edge index the caller would have to derive from the subdivider's own edge numbering.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `subdivideAutoMovieSurface` refuses a crease naming no cage edge, a repeated edge, and a sharpness outside 0 to 10, instead of ignoring or clamping it.

## @evidence contracts/development/common.md#meaningful-documentation

States the rule sequence a sharpness selects, the infinite value, the boundary interaction, and the admitted range.
