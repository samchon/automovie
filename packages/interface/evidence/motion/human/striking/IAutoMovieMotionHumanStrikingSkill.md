# src/motion/human/striking/IAutoMovieMotionHumanStrikingSkill.ts#IAutoMovieMotionHumanStrikingSkill

## @evidence contracts/development/common.md#meaningful-documentation

depth: How far the non-striking or returning glove sags below its guard, metres; 0 when it does not drop. seconds: How long the drop lasts after the strike's contact, seconds.

## @evidence contracts/development/design.md#principled-representation

depth: How far the non-striking or returning glove sags below its guard, metres; 0 when it does not drop. seconds: How long the drop lasts after the strike's contact, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingSkill.ts (StrikingSkill.guardDrop, return); striking/StrikingSkill.ts (StrikingSkill.reactionLaw, return); striking/punch.ts (punch.plan); striking/punchGeometry.ts (punchGeometry); striking/StrikingSkill.ts (StrikingSkill.reactionBand).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in StrikingSkill.guardDrop.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingSkill.ts#IAutoMovieMotionHumanStrikingSkill.IGuardDrop

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and the meaning of zero.

## @evidence contracts/development/design.md#principled-representation

A depth in metres and a duration in seconds, zero for no drop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the punch's return reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
