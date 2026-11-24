# src/human/generation/IAutoMovieHumanArmConstruction.ts#IAutoMovieHumanArmConstruction

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanArmConstruction exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups the regional arm and hand inputs in calibration millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the inputs used by BodyLaw, ArmInterim and the arm's source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime reads each handed set of measures with the same unit and sex controls.

# src/human/generation/IAutoMovieHumanArmConstruction.ts#IAutoMovieHumanArmConstruction.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What an arm reads.

## @evidence contracts/development/design.md#principled-representation `upper`: Upper arm length. `lower`: Lower arm length. `bicep`: Biceps tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmInterim.sites and AutoMovieHumanLimbRest.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `upper`, `lower`, `bicep`, `elbow`, `forearm`, `wrist`, `circumference`, `sex`, `left`, `right`, `scale`; callers supply the complete record.
