# src/human/generation/head/IAutoMovieHumanHeadNeckBaseTrial.ts#IAutoMovieHumanHeadNeckBaseTrial.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One actual source and its requested numerical observation; no prepared callback survives.

## @evidence contracts/development/design.md#principled-representation `radius`: Actual root-parameter radius declaration, calibration mm. `centre`: Actual physical-Y axis declaration, calibration mm. `height`: Actual finite-clock height declaration with this trial's side phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadNeckBaseTrial.create. Also types AutoMovieHumanHeadNeckBase.retained, AutoMovieHumanHeadNeckBase.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `radius`, `centre`, `height`, `sidePhase`, `measured`, `points`, `polygon`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadNeckBaseTrial.ts#IAutoMovieHumanHeadNeckBaseTrial.IPolarReading

## @evidence contracts/development/common.md#meaningful-documentation

Native polar data of the immutable normal template, independent of every world radius/height trial.

## @evidence contracts/development/design.md#principled-representation `jet`: Original radial value and its first/second polar derivatives, calibration mm. `cos`: Cosine of the exact queried native polar parameter. `sin`: Sine of the exact queried native polar parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the prepared original polar piece reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `jet`, `cos`, `sin`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadNeckBaseTrial.ts#IAutoMovieHumanHeadNeckBaseTrial.IPolar

## @evidence contracts/development/common.md#meaningful-documentation

Native readings prepared on the fixed original piece partition.

## @evidence contracts/development/design.md#principled-representation `stations`: Actual quarter/G2 source-piece boundaries in the tape clock. The piece reader evaluates a prepared fixed piece or a requested moving piece.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadNeckBaseTrial.prepareNative. Read by AutoMovieHumanHeadNeckBaseTrial.create. Also types AutoMovieHumanHeadNeckBase.polar, AutoMovieHumanHeadNeckBaseTrial.native.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared `stations` and `piece` operation refer to the actual original template.

# src/human/generation/head/IAutoMovieHumanHeadNeckBaseTrial.ts#IAutoMovieHumanHeadNeckBaseTrial.CreateExtents

## @evidence contracts/development/common.md#meaningful-documentation

ISO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed polar angle.

## @evidence contracts/development/design.md#principled-representation

ISO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed polar angle. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadNeckBaseTrial.CreateExtents is the canonical exchange used by AutoMovieHumanHeadNeckBaseTrial.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadNeckBaseTrial.create for iSO 8559-1 3.1.7 identifies an anterior trapezius border, not a fixed polar angle.
