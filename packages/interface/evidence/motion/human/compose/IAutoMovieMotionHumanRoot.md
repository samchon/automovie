# src/motion/human/compose/IAutoMovieMotionHumanRoot.ts#IAutoMovieMotionHumanRoot

## @evidence contracts/development/common.md#meaningful-documentation

point: The root's move in its own floor frame; `x` left, `y` up, `z` forward, metres. yaw: The heading's turn about +Y, degrees; positive toward the performer's left. from: Seconds since the action's start from which the root is written.

## @evidence contracts/development/design.md#principled-representation

point: The root's move in its own floor frame; `x` left, `y` up, `z` forward, metres. yaw: The heading's turn about +Y, degrees; positive toward the performer's left. from: Seconds since the action's start from which the root is written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.place, offset); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.scale, offset); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.scale, return); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.excursion, to); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.excursion, return); compose/AutoMovieMotionHumanRoot.ts (AutoMovieMotionHumanRoot.shift, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

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
