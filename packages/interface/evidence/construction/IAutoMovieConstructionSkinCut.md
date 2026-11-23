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
