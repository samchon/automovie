# src/motion/human/compose/IAutoMovieMotionHumanTouchDrink.ts#IAutoMovieMotionHumanTouchDrink

## @evidence contracts/development/common.md#meaningful-documentation

lean: How far the vessel's axis leans from where the grasp holds it toward the region, degrees. bend: The elbow's hint, world metres.

## @evidence contracts/development/design.md#principled-representation

lean: How far the vessel's axis leans from where the grasp holds it toward the region, degrees. bend: The elbow's hint, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.drinking, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.admitted, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.held, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.held.found.later, phase); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.trial, after); compose/AutoMovieMotionHumanTouchDrink.ts (AutoMovieMotionHumanTouchDrink.drinking, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieHumanLimbGoal, IAutoMovieVector3, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanTouchDrink.ts#IAutoMovieMotionHumanTouchDrink.IHeld

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The lean found and the goal it gives, so the stroke and its reference read the one goal the arm was admitted with.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: the stroke reads the goal, a reader of the law the lean.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The goal is the admitted one, never rebuilt by the caller.

# src/motion/human/compose/IAutoMovieMotionHumanTouchDrink.ts#IAutoMovieMotionHumanTouchDrink.IDrink

## @evidence contracts/development/common.md#meaningful-documentation

The member states its meaning and frame; the facing's own are `IAutoMovieMotionHumanTouchUpright.IFacing`'s.

## @evidence contracts/development/design.md#principled-representation

The search's answer and the hint it was admitted with, one record, so the stroke reads the arm the admission read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member beyond the facing's, read by the hand-to-face arm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hint is the one the admitted arm was fitted with, never solved again by the caller.

# src/motion/human/compose/IAutoMovieMotionHumanTouchDrink.ts#IAutoMovieMotionHumanTouchDrink.IAfter

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and frame.

## @evidence contracts/development/design.md#principled-representation

The drinking phase's posture and region, the second place the arm must hold the vessel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by `trial` and `held`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The region is read on that posture, never moved by hand.
