# src/motion/human/compose/IAutoMovieMotionHumanTouchEffector.ts#IAutoMovieMotionHumanTouchEffector.IEffector

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

A surface, a shape, an optional tool offset and the two directions laid against the region.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members read by `local`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Without the axes a surface uses its own normal and forward, so a bare skin row states nothing extra.

# src/motion/human/compose/IAutoMovieMotionHumanTouchEffector.ts#IAutoMovieMotionHumanTouchEffector.Direction

## @evidence contracts/development/common.md#meaningful-documentation

States the two forms, what a blend is for and why it is side-free.

## @evidence contracts/development/design.md#principled-representation

Any direction in the hand's frame is a combination of its three orthogonal axes; the record states the combination and `direction` normalises it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One alias, read by the effector's two laid directions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No raw bone-space vector, which would mean opposite things on the two hands; all weights zero is refused by `direction`.

# src/motion/human/compose/IAutoMovieMotionHumanTouchEffector.ts#IAutoMovieMotionHumanTouchEffector.Axis

## @evidence contracts/development/common.md#meaningful-documentation

Names the anatomical directions, what the grasp axis is and that a leading minus is the opposite.

## @evidence contracts/development/design.md#principled-representation

The hand's three anatomical axes, the power grip's oblique axis and their negatives, the directions a held tool or a surface can point in the hand's rest frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight literals, the entries of `AXES`, read by `axis` and, through `Direction`, by the effector's two laid directions; the tool offset weights the three anatomical axes directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Anatomical names, not bone-space x, y and z, so a left and a right hand state the same effector.

# src/motion/human/compose/IAutoMovieMotionHumanTouchEffector.ts#IAutoMovieMotionHumanTouchEffector.ILocalResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Effector point in its bone-local frame, metres.

## @evidence contracts/development/design.md#principled-representation

point: Effector point in its bone-local frame, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanTouchEffector.ts (AutoMovieMotionHumanTouchEffector.local, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
