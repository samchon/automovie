# src/cinematics/IAutoMovieSampleIrradianceVolume.ts#IAutoMovieSampleIrradianceVolume.IProps

## @evidence contracts/development/design.md#principled-representation

A grid, a world point in metres and a world normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All three are read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point and normal reuse `IAutoMovieVector3`.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.
