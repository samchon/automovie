# src/motion/human/striking/IAutoMovieMotionHumanDefend.ts#IAutoMovieMotionHumanDefend

## @evidence contracts/development/common.md#meaningful-documentation

outcome: The forced outcome; drawn from the defender's skill when absent.

## @evidence contracts/development/design.md#principled-representation

outcome: The forced outcome; drawn from the defender's skill when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.defend, params); striking/defend.ts (defend.plan, context); striking/defend.ts (defend.idle, context); striking/defendGeometry.ts (defendGeometry.build, context); striking/defend.ts (defend.plan); striking/defendGeometry.ts (defendGeometry.build).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanDefenceOutcome.Outcome identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanDefend.ts#IAutoMovieMotionHumanDefend.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the kind, the answered strike's anchor and the outcome's default.

## @evidence contracts/development/design.md#principled-representation

A closed union of defence kinds, the strike as its anchor (checked when planning to strike this performer) and an optional forced outcome.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the outcome union.

# src/motion/human/striking/IAutoMovieMotionHumanDefend.ts#IAutoMovieMotionHumanDefend.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the eight kinds and points to where each is described.

## @evidence contracts/development/design.md#principled-representation

A closed union of the eight kinds, so only a kind the law builds geometry for type-checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the defend law's `kind` member and by the Defence family's defence presets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit literals; the defence geometry owns each kind's posture.
