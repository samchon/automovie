# src/human/generation/arm/IAutoMovieHumanArmLaw.ts#IAutoMovieHumanArmLaw

## @evidence contracts/development/common.md#meaningful-documentation

The arm's sections for one side, in the left frame: a one-parameter family of planes from the hand's branch (low parameter) through the heel, the forearm and the upper arm to the level shoulder ring (high parameter).

## @evidence contracts/development/design.md#principled-representation `wrist`: Hand origin, mm. `elbow`: Elbow centre, mm. `crease`: Centre of the section at the wrist crease, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmConstruction.remember, AutoMovieHumanArmLaw.of. Read by AutoMovieHumanArmConstruction.remember, AutoMovieHumanArmLayers.of. Also types AutoMovieHumanArmConstruction.BUILT, AutoMovieHumanArmConstruction.laws.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `wrist`, `elbow`, `crease`, `layers`; callers supply the complete record.
