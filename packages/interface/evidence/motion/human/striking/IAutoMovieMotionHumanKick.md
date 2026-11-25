# src/motion/human/striking/IAutoMovieMotionHumanKick.ts#IAutoMovieMotionHumanKick.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

Closed unions for the technique and the leg, the interface's motion target, the accuracy union and a feint share in (0, 1).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan, the defence's telegraph and the kickboxing rules read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the target and accuracy types.

# src/motion/human/striking/IAutoMovieMotionHumanKick.ts#IAutoMovieMotionHumanKick.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Names the two techniques and the surface each lands.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two kicks this law plans, so no other technique type-checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the kick law's `technique` member and by the strike family's kick presets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit literals; the kick law owns each technique's geometry.

# src/motion/human/striking/IAutoMovieMotionHumanKick.ts#IAutoMovieMotionHumanKick.Leg

## @evidence contracts/development/common.md#meaningful-documentation

Names the two legs by the stance.

## @evidence contracts/development/design.md#principled-representation

A closed union of the stance's two legs, so no other leg type-checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the kick law's `leg` member and by the strike family's kick presets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit literals; the stance owns which physical leg each names.

# src/motion/human/striking/IAutoMovieMotionHumanKick.ts#IAutoMovieMotionHumanKick.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

source: What a redirect continues.

## @evidence contracts/development/design.md#principled-representation

source: What a redirect continues.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/kick.ts (kick.plan, return); striking/kick.ts (kick.continues, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanKickGeometry.ISource identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
