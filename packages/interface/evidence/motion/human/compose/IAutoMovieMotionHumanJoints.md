# src/motion/human/compose/IAutoMovieMotionHumanJoints.ts#IAutoMovieMotionHumanJoints

## @evidence contracts/development/common.md#meaningful-documentation

from: Seconds since the action's start from which the angles are added. to: Seconds since the action's start until which the angles are added.

## @evidence contracts/development/design.md#principled-representation

from: Seconds since the action's start from which the angles are added. to: Seconds since the action's start until which the angles are added.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanHead.ts (AutoMovieMotionHumanHead.share, return); compose/AutoMovieMotionHumanHead.ts (AutoMovieMotionHumanHead.oscillate, return); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.channels, angles); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.pulse, peak); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.pulse, return); daily/handToFace.ts (handToFace.plan.turned, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, AutoMovieMotionHumanChannel identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanJoints.ts#IAutoMovieMotionHumanJoints.Angles

## @evidence contracts/development/common.md#meaningful-documentation

States the triple's order and unit and the key.

## @evidence contracts/development/design.md#principled-representation

The posture's own joint form, so added angles and held angles sum member by member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One alias, used by every function here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keyed by `AutoMovieHumanoidBone`, not by string.

# src/motion/human/compose/IAutoMovieMotionHumanJoints.ts#IAutoMovieMotionHumanJoints.IAdd

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit, and which bones the angles may name.

## @evidence contracts/development/design.md#principled-representation

The channels claimed, the span written and the angles added at each second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by `add`; `pulse` fills them from a clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The channels are stated and checked against the bones at each second instead of being trusted.
