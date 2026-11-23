# src/human/IAutoMovieHumanParameters.ts#IAutoMovieHumanParameters

## @evidence contracts/development/common.md#meaningful-documentation

Complete Human input.

## @evidence contracts/development/design.md#principled-representation `body`: Body tapes, lengths, skeletal breadths, landmark heights and composition. `head`: Cranial and facial dimensions. `extremities`: Independent hand and foot dimensions when supplied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodyAnatomy.resolve, AutoMovieHumanBodyAnatomy.sexOf, AutoMovieHumanBodyLaw.limbInputs. Also types AutoMovieHumanBodyAnatomy.feet, AutoMovieHumanBodyAnatomy.hands.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `extremities`: Independent hand and foot dimensions when supplied. `appearance`: Skin, hair, brows, eyelashes and underwear choices. `pigmentation`: Constitutive skin and iris pigmentation. `pose`: Clinical pose channels in degrees, except jaw distances in millimetres; omitted channels use the evaluator's neutral defaults. `expression`: Facial action-unit intensities.
