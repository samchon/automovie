# src/human/generation/IAutoMovieHumanBodyLaw.ts#IAutoMovieHumanBodyLaw.ILimbInputs

## @evidence contracts/development/common.md#meaningful-documentation

Public limb definitions shared by construction and source-curve inspection, before any skin.

## @evidence contracts/development/design.md#principled-representation `stature`: Stature in calibration mm. `legs`: Leg tapes, anatomical controls and calibration scale. `arms`: Arm tapes and each hand's own dimensions, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLaw.limbInputs, arms. Read by AutoMovieHumanBodyPreparation.trunkInputs. Also types AutoMovieHumanBodyLaw.definitions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stature`, `legs`, `arms`, `feet`, `crotch`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyLaw.ts#IAutoMovieHumanBodyLaw.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Calibrations for one parameter set.

## @evidence contracts/development/design.md#principled-representation `body`: Body chains, events, poles, apertures and globes in calibration mm. `vermilion`: Exterior lip boundary in the same frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLaw.calibrate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `body`, `vermilion`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyLaw.ts#IAutoMovieHumanBodyLaw.IDefinition

## @evidence contracts/development/common.md#meaningful-documentation

The shared production source assembly, explicitly before final solid realization.

## @evidence contracts/development/design.md#principled-representation `prepared`: Identical invocation context for explicit original/raw requests and legacy receiver observations. `lane`: The exact body tree and source premises consumed by calibration. `standing`: Existing neck/trunk metadata retained for the completed calibration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyLaw.define. Also types AutoMovieHumanBodyLaw.definition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `prepared`, `lane`, `standing`, `head`, `skeleton`, `hands`, `stature`, `diagnostics`; callers supply the complete record.
