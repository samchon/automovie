# src/schema/IAutoMovieHumanHandPoseSchema.ts#IAutoMovieHumanHandPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration enumerates independent digits and distinguishes the thumb from the four fingers. It states the common unit.

## @evidence contracts/development/design.md#principled-representation

Typia applies each optional child schema independently. The Human table retains separate thumb rows and instantiates the finger template for each of the four named digits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The arm pose supplies the hand's anatomical side. This record reuses the shared four-finger schema and keeps the thumb's distinct joint model.
