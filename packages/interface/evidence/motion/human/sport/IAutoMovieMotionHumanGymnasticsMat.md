# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsMat.ts#IAutoMovieMotionHumanGymnasticsMat.ILieProps

## @evidence contracts/development/common.md#meaningful-documentation

body: Borrowed body used to settle onto the mat. velocity: Initial centre-of-mass velocity in world metres per second. height: Mat contact-plane height on world +Y, metres.

## @evidence contracts/development/design.md#principled-representation

body: Borrowed body used to settle onto the mat. velocity: Initial centre-of-mass velocity in world metres per second. height: Mat contact-plane height on world +Y, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsMat.ts (GymnasticsMat.lie, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass.IModel, IAutoMovieMotionHumanPosture, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
