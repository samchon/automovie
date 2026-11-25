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
