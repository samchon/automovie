# src/motion/human/ballStrike/IAutoMovieMotionHumanKickBall.ts#IAutoMovieMotionHumanKickBall

## @evidence contracts/development/common.md#meaningful-documentation

foot: The kicking foot; `right` when absent. target: Where the ball is kicked toward; along the heading when absent.

## @evidence contracts/development/design.md#principled-representation

foot: The kicking foot; `right` when absent. target: Where the ball is kicked toward; along the heading when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ballStrike/kickBall.ts (kickBall.plan, context); chain/HumanChainMutual.ts (HumanChainMutual.kickBall, params); executable/cases/ballStrikeCases.ts (ballStrikeCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ballStrike/IAutoMovieMotionHumanKickBall.ts#IAutoMovieMotionHumanKickBall.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

The ball, the kicking foot and the direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The planner reads the two release components only for an explicitly launched ball.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ball is the scene's prop; its size is its own.
