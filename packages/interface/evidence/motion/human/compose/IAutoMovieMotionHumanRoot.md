# src/motion/human/compose/IAutoMovieMotionHumanRoot.ts#IAutoMovieMotionHumanRoot.IOffset

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame, axes, unit and sign.

## @evidence contracts/development/design.md#principled-representation

A rigid move on the floor: a translation in the body's own frame and a turn about the vertical.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; pitch and roll belong to the trunk channel and are not here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the vector type; the turn is a signed number of degrees like the posture's yaw.

# src/motion/human/compose/IAutoMovieMotionHumanRoot.ts#IAutoMovieMotionHumanRoot.ITravel

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The span the root is written over and the displacement at each second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all read by `travel`; `excursion` fills them from a clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The offset is a function of seconds and not a pair of ends with a named easing.
