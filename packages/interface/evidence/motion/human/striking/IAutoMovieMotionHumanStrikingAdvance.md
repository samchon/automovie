# src/motion/human/striking/IAutoMovieMotionHumanStrikingAdvance.ts#IAutoMovieMotionHumanStrikingAdvance.Advance

## @evidence contracts/development/common.md#meaningful-documentation

How the body goes with a stroke.

## @evidence contracts/development/design.md#principled-representation

Closed choices "none", "step", "lunge" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim.within, candidate); lexicon/HumanSword.ts (HumanSword.aim.advance, candidate); striking/StrikingAdvance.ts (StrikingAdvance.travel, advance); striking/StrikingBlade.ts (StrikingBlade.shoulder, advance); lexicon/HumanSword.ts (HumanSword.aim).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanSword.aim.within.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingAdvance.ts#IAutoMovieMotionHumanStrikingAdvance.IBaseStroke

## @evidence contracts/development/common.md#meaningful-documentation

clock: Strike action's relative event clock. travel: Optional approach distance in metres; omitted uses the selected advance's full travel.

## @evidence contracts/development/design.md#principled-representation

clock: Strike action's relative event clock. travel: Optional approach distance in metres; omitted uses the selected advance's full travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingAdvance.ts (StrikingAdvance.base, stroke).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionClock, IAutoMovieMotionHumanStrikingAdvance.Advance, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
