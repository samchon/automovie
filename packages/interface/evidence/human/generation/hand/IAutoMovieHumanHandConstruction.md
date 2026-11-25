# src/human/generation/hand/IAutoMovieHumanHandConstruction.ts#IAutoMovieHumanHandConstruction.IFixedContourInput

## @evidence contracts/development/common.md#meaningful-documentation

Authored fixed contour topology before JSON tuple and literal restoration.

## @evidence contracts/development/design.md#principled-representation `sections`: Physical original section coordinates and their closed coefficient loops. `intervals`: Original section-to-section component incidence. `events`: Observed source events with their physical coordinate and incident loops.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandConstruction.fixedContour.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `intervals`: Original section-to-section component incidence.

# src/human/generation/hand/IAutoMovieHumanHandConstruction.ts#IAutoMovieHumanHandConstruction.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What one side's hand reads.

## @evidence contracts/development/design.md#principled-representation `calibration`: Calibration the body's surface is built on, for the knuckle section's skin. `side`: Which side; the hand is built in the left frame either way. `given`: The person's hand measures for this side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandConstruction.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `calibration`, `side`, `given`, `circumference`, `wristTape`, `makeArm`, `key`, `lofted`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandConstruction.ts#IAutoMovieHumanHandConstruction.IBuilt

## @evidence contracts/development/common.md#meaningful-documentation

One side's hand: the solve, the landmarks the skeleton stands on, and the chains.

## @evidence contracts/development/design.md#principled-representation `measures`: The hand's scales as solved. `law`: The arm built with those scales. `joints`: The knuckles and the thumb's base, left frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmConstruction.remember, AutoMovieHumanHandConstruction.build. Read by AutoMovieHumanArmConstruction.remember. Also types AutoMovieHumanArmConstruction.BUILT, AutoMovieHumanArmConstruction.built.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `measures`, `law`, `joints`, `lines`, `thumb`, `palm`, `digits`, `poles`, `nails`; callers supply the complete record.
