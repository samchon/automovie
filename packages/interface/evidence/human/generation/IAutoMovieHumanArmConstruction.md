# src/human/generation/IAutoMovieHumanArmConstruction.ts#IAutoMovieHumanArmConstruction.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What an arm reads.

## @evidence contracts/development/design.md#principled-representation `upper`: Upper arm length. `lower`: Lower arm length. `bicep`: Biceps tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmConstruction.add, AutoMovieHumanArmConstruction.bones, AutoMovieHumanArmConstruction.limb.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `upper`, `lower`, `bicep`, `elbow`, `forearm`, `wrist`, `circumference`, `sex`, `left`, `right`, `scale`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanArmConstruction.ts#IAutoMovieHumanArmConstruction.IBones

## @evidence contracts/development/common.md#meaningful-documentation

One side's bone landmarks by the arm's law, in world millimetres, before any arm skin exists: what a skeleton stands its arm and hand on.

## @evidence contracts/development/design.md#principled-representation `elbow`: The elbow centre. `crease`: Centre of the hand's section at the wrist crease. `length`: Hand length the hand was made to, from the crease.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmConstruction.bones. Also types AutoMovieHumanArmConstruction.landmarks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `elbow`, `crease`, `length`, `thumb`, `digits`; callers supply the complete record.
