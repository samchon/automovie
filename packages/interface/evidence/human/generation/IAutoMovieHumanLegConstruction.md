# src/human/generation/IAutoMovieHumanLegConstruction.ts#IAutoMovieHumanLegConstruction

## @evidence contracts/development/common.md#meaningful-documentation

Describes calibration leg tapes, body controls and optional measured gluteal-furrow height; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Calibration leg tapes, body controls, optional measured gluteal-furrow height and optional per-side bone lengths. The bone lengths are Euclidean joint-centre spans in calibration millimetres. The preparation validates numerical feasibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanLegConstruction; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing LegConstruction contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanLegConstruction.ts#IAutoMovieHumanLegConstruction.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

Tape measures a leg reads, in the same millimetres as the calibration.

## @evidence contracts/development/design.md#principled-representation `calf`: Calf tape. `knee`: Knee tape. `thigh`: Thigh tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by tapes. Read by crotch, feet, AutoMovieHumanLegConstruction.apply. Also types AutoMovieHumanBodyLaw.legs, AutoMovieHumanBodyLaw.inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `furrow`: Gluteal furrow height, the gluteal fold's lowest point over the floor (ANSUR 1988), in calibration millimetres: the thigh tape's station (ISO 8559-1 5.3.20, just below the fold) and the infragluteal fold's centre.
