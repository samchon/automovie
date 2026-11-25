# src/geometry/IAutoMovieBuildWall.ts#IAutoMovieBuildWall.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Metre width, height and depth define a centred local XY wall with Z thickness; openings use bottom-left wall coordinates. Positive finite sizes, unique opening IDs and supported nonoverlapping openings remain runtime admission requirements.

## @evidence contracts/development/design.md#principled-representation

Metre width, height and depth define a centred local XY wall with Z thickness; openings use bottom-left wall coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

buildAutoMovieWall consumes the size and opening declarations before constructing its cell lattice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Positive finite sizes, unique opening IDs and supported nonoverlapping openings remain runtime admission requirements.
