# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut

## @evidence contracts/development/common.md#meaningful-documentation

States the region, the smooth minimum with its bound and derivatives, the residual and the rail's jets.

## @evidence contracts/development/design.md#principled-representation

One generating curve for a shared boundary: the skin's own intersection with a declared surface, exact with its jets, which the rail cycle, the band's edge and the crossing between them all read (construction.md, Connections: Ownership).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plane record, the input, the built cut with one reader and its station bounds, and one builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A phase without a crossing, already past the surface or tangent to it is refused with its phase; nothing is clamped to the face's end or refitted.

# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut.IPlane

## @evidence contracts/development/design.md#principled-representation

A point and a unit normal toward the kept half space.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vectors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only; the caller resolves the declared frame and normalizes.

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the kept side.

# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut.IInput

## @evidence contracts/development/design.md#principled-representation

The skin, the planes with their rounding, the side the band stands on and the face's own stations determine the curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six fields; the stations and the sample count are sampling inputs the caller already owns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only; admission of the declaration belongs to the caller.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and role.

# src/construction/IAutoMovieConstructionSkinCut.ts#IAutoMovieConstructionSkinCut.ICut

## @evidence contracts/development/design.md#principled-representation

The curve's station with two derivatives at any phase, and the stations it spans at its admitted phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One reader and one interval.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader solves the residual on the skin at the phase asked; it interpolates no stored station.

## @evidence contracts/development/common.md#meaningful-documentation

States the reader's result and the interval's source.
