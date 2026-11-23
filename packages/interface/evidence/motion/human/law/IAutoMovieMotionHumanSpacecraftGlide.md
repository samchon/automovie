# src/motion/human/law/IAutoMovieMotionHumanSpacecraftGlide.ts#IAutoMovieMotionHumanSpacecraftGlide

## @evidence contracts/development/common.md#meaningful-documentation

Gives the placement premise, handrail roles, clock units and midpoint clearance bound.

## @evidence contracts/development/design.md#principled-representation

One fixture owns both contact ids, and the same ramp duration bounds the acceleration and braking phases of the straight glide.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The law reads two contact names on one fixture, a hand, two phase lengths and the free hand's midpoint clearance. The performer supplies the entry placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No target point or floor support is synthesized when a contact name is wrong.
