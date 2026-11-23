# src/human/generation/hand/IAutoMovieHumanHandVector.ts#IAutoMovieHumanHandVector.HullPoints

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed planar section points [x, y] in millimetres. The hand tape reader takes the perimeter of their convex hull, so their input order need not trace a polygon.

## @evidence contracts/development/design.md#principled-representation

Borrowed planar section points [x, y] in millimetres. The hand tape reader takes the perimeter of their convex hull, so their input order need not trace a polygon.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandVector.HullPoints is the canonical exchange used by AutoMovieHumanHandVector.hull.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanHandVector input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
