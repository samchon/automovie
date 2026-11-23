# src/cinematics/IAutoMovieSampleIrradianceVolume.ts#IAutoMovieSampleIrradianceVolume

## @evidence contracts/development/design.md#principled-representation

Groups the input of the volume sampler.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`sampleAutoMovieIrradianceVolume` reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a consumer.

## @evidence contracts/development/common.md#meaningful-documentation

States that it is the CPU reference of the material term.

# src/cinematics/IAutoMovieSampleIrradianceVolume.ts#IAutoMovieSampleIrradianceVolume.IProps

## @evidence contracts/development/design.md#principled-representation

A grid, a world point in metres and a world normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All three are read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point and normal reuse `IAutoMovieVector3`.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.
