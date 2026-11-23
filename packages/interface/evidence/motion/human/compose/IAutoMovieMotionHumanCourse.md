# src/motion/human/compose/IAutoMovieMotionHumanCourse.ts#IAutoMovieMotionHumanCourse

## @evidence contracts/development/common.md#meaningful-documentation

yaw: The heading the course runs along, degrees about +Y. posture: The posture at a second with the hips a distance along the heading, metres. target: Where the extrapolated centre of mass is asked at a second, world metres along the heading.

## @evidence contracts/development/design.md#principled-representation

yaw: The heading the course runs along, degrees about +Y. posture: The posture at a second with the hips a distance along the heading, metres. target: Where the extrapolated centre of mass is asked at a second, world metres along the heading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanCourse.ts (AutoMovieMotionHumanCourse.solve, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanCourse.ts#IAutoMovieMotionHumanCourse.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and its unit.

## @evidence contracts/development/design.md#principled-representation

A posture builder, a target and a time span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven members, all read by `solve`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target is a function of time, so no foot path is assumed.
