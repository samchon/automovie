# src/human/generation/arm/IAutoMovieHumanArmAxis.ts#IAutoMovieHumanArmAxis.IFixedChart

## @evidence contracts/development/common.md#meaningful-documentation

One physically observed absolute digit section frame in native world millimetres.

## @evidence contracts/development/design.md#principled-representation `stationMm`: Distance along the unchanged source course, millimetres. `originMm`: Absolute plane origin in native world millimetres. `u`: First observed tangent to the section plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmAxis.observed. Also types AutoMovieHumanArmAxis.vector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stationMm`, `originMm`, `u`, `v`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmAxis.ts#IAutoMovieHumanArmAxis.IAxis

## @evidence contracts/development/common.md#meaningful-documentation

The walk.

## @evidence contracts/development/design.md#principled-representation `elbow`: Walk length of the turn's middle, where the heading bisects the corner. `soft`: Half the turn's length, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmAxis.walk. Read by AutoMovieHumanArmPieces.inputs, AutoMovieHumanArmTube.build. Also types AutoMovieHumanArmLaw.axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `elbow`, `soft`; callers supply the complete record.
