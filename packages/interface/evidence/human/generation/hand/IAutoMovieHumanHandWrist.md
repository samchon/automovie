# src/human/generation/hand/IAutoMovieHumanHandWrist.ts#IAutoMovieHumanHandWrist

## @evidence contracts/development/common.md#meaningful-documentation

What the hand reads from the arm it grows out of, for one side in the left frame: the forearm's wrist and the centre of its section at the wrist crease, and the tape the forearm's tube measures there.

## @evidence contracts/development/design.md#principled-representation `wrist`: The hand form's origin, world millimetres. `elbow`: The elbow, where the walk turns from the upper arm onto the forearm. `crease`: Centre of the section at the wrist crease.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandFingers.digitsOf, AutoMovieHumanHandJoints.jointsOf, AutoMovieHumanHandSkinTargets.skinTargets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `wrist`, `elbow`, `crease`; callers supply the complete record.
