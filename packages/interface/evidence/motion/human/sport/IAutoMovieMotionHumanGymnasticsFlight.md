# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsFlight.ts#IAutoMovieMotionHumanGymnasticsFlight

## @evidence contracts/development/common.md#meaningful-documentation

centre: Launch centre of mass in world metres. velocity: Launch centre-of-mass velocity in world metres per second.

## @evidence contracts/development/design.md#principled-representation

centre: Launch centre of mass in world metres. velocity: Launch centre-of-mass velocity in world metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsFlight.ts (GymnasticsFlight.model, return); sport/GymnasticsFlight.ts (GymnasticsFlight.centre, model); sport/GymnasticsFlight.ts (GymnasticsFlight.placed, model); sport/GymnasticsFlight.ts (GymnasticsFlight.launch, model); sport/GymnasticsFlight.ts (GymnasticsFlight.launch, return); sport/GymnasticsMat.ts (GymnasticsMat.lie).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieResolveCenterOfMass.IModel, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsFlight.ts#IAutoMovieMotionHumanGymnasticsFlight.ILaunchResult

## @evidence contracts/development/common.md#meaningful-documentation

centre: Launch centre of mass in world metres. velocity: Launch centre-of-mass velocity in world metres per second.

## @evidence contracts/development/design.md#principled-representation

centre: Launch centre of mass in world metres. velocity: Launch centre-of-mass velocity in world metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsFlight.ts (GymnasticsFlight.launch, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
