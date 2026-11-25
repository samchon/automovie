# src/motion/human/compose/IAutoMovieMotionHumanPlaced.ts#IAutoMovieMotionHumanPlaced.IArm

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The window, the held angles, the weight, the place and the hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `arm` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The place is a function, so a moving place needs no second form.

# src/motion/human/compose/IAutoMovieMotionHumanPlaced.ts#IAutoMovieMotionHumanPlaced.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

The point uses world metres. Facing and optional finger direction orient the hand.

## @evidence contracts/development/design.md#principled-representation

World position is independent of orientation. The caller supplies usable directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hand placer needs the point and facing. Forward constrains finger direction when supplied.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All three quantities reuse the shared vector type without imposing a preset hand pose.

# src/motion/human/compose/IAutoMovieMotionHumanPlaced.ts#IAutoMovieMotionHumanPlaced.IWristPlace

## @evidence contracts/development/common.md#meaningful-documentation

Forward supplies the preferred world-space direction of the fingers as a required part of the wrist construction.

## @evidence contracts/development/design.md#principled-representation

The target point and surface normal come from IPlace. The additional required direction completes the wrist's orientation frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, place).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
