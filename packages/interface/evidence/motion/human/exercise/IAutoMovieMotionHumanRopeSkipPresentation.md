# src/motion/human/exercise/IAutoMovieMotionHumanRopeSkipPresentation.ts#IAutoMovieMotionHumanRopeSkipPresentation

## @evidence contracts/development/common.md#meaningful-documentation

Defines the action address and dimensions, with the cord measured between the handle tips.

## @evidence contracts/development/design.md#principled-representation

Uses metre dimensions and an anchored action on the performance's film clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The presentation reads the placed action and pose through the performance. The host supplies the cable and handle dimensions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Handle mounts and cord shape stay coupled to the same displayed hand samples. No dynamics parameters are implied.

# src/motion/human/exercise/IAutoMovieMotionHumanRopeSkipPresentation.ts#IAutoMovieMotionHumanRopeSkipPresentation.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

States handle axes, attachment points and world-space ownership.

## @evidence contracts/development/design.md#principled-representation

Both handle transforms and four cord positions use world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses rigid transforms and the render soft-prop frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both handle tips attach to the emitted cord at their drawn coordinates.
