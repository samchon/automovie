# src/human/generation/hand/IAutoMovieHumanHandMeasures.ts#IAutoMovieHumanHandMeasures

## @evidence contracts/development/common.md#meaningful-documentation

One hand's measures at their ANSUR II and ISO 7250-1 sites, in calibration millimetres. The optional phalangeal ratio acts on the derived bones with their roots held.

## @evidence contracts/development/design.md#principled-representation `length`: Wrist to the tip of the middle finger, mm. `palm`: Wrist to the root of the middle finger, mm. `breadth`: Breadth across the palm over knuckles II to V, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandBones.of, AutoMovieHumanHandJoints.knuckles, AutoMovieHumanHandSkinTargets.skinTargets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `length`, `palm`, `breadth`, `thumb`; callers supply the complete record.
