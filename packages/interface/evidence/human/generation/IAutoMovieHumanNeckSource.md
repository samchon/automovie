# src/human/generation/IAutoMovieHumanNeckSource.ts#IAutoMovieHumanNeckSource

## @evidence contracts/development/common.md#meaningful-documentation

Describes registered neck sections in calibration millimetres and their separate sampling metadata.

## @evidence contracts/development/design.md#principled-representation

The section descriptors give circle samples and frame data. The head mass consumes the associated normal plane, C7 datum and overlap centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanNeckSource; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups one input-derived section representation and its registered outputs. Runtime construction remains with Human.

# src/human/generation/IAutoMovieHumanNeckSource.ts#IAutoMovieHumanNeckSource.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Shared source descriptors, not a loft result or final neck surface.

## @evidence contracts/development/design.md#principled-representation `rows`: Four samples of the circular radius taper, in increasing centre height. `head`: Normal plane origin, C7 registration and estimated axis slope. `bottom`: Internal overlap centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeckSource.of. Read by AutoMovieHumanNeckConstruction.generate, AutoMovieHumanNeckConstruction.define, AutoMovieHumanHeadLane.create. Also types AutoMovieHumanBodySources.neckSource, AutoMovieHumanHeadCanonical.lower.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `rows`, `head`, `bottom`, `scale`, `order`, `samples`, `registration`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanNeckSource.ts#IAutoMovieHumanNeckSource.IRow

## @evidence contracts/development/common.md#meaningful-documentation

One original generating row, with dimensions in calibration mm.

## @evidence contracts/development/design.md#principled-representation `ring`: Analytic coefficients of a circle in the declared phase direction. `origin`: Centre in calibration mm. `width` and `depth`: Lateral radius and forward projection in calibration mm. `scale`: Converts the height terms from world to calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by AutoMovieHumanNeckSource.of and read by AutoMovieHumanNeckSource.point.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `ring`, `origin`, `width`, `depth`, `scale`; callers supply the complete record.
