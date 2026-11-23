# src/motion/human/striking/IAutoMovieMotionHumanFootStrike.ts#IAutoMovieMotionHumanFootStrike

## @evidence contracts/development/common.md#meaningful-documentation

technique: The foot strike. leg: The kicking leg, rear when absent. at: What it strikes. spin: A whole turn first. jump: Off the floor at contact.

## @evidence contracts/development/design.md#principled-representation

A closed technique union, a target, the leg side and two modifier flags.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the foot strike law and its strike rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the motion target; the law owns reach.

# src/motion/human/striking/IAutoMovieMotionHumanFootStrike.ts#IAutoMovieMotionHumanFootStrike.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Names the seven foot strikes.

## @evidence contracts/development/design.md#principled-representation

Explicit literals, each with its contact point, travel and turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the foot strike law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law owns each technique's geometry.

# src/motion/human/striking/IAutoMovieMotionHumanFootStrike.ts#IAutoMovieMotionHumanFootStrike.Leg

## @evidence contracts/development/common.md#meaningful-documentation

Names the two legs by the stance.

## @evidence contracts/development/design.md#principled-representation

Two literals relative to the stance's lead.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the foot strike law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law resolves the side from the entry's stance.

# src/motion/human/striking/IAutoMovieMotionHumanFootStrike.ts#IAutoMovieMotionHumanFootStrike.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The technique, the target, the leg and the two modifiers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the foot strike plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
