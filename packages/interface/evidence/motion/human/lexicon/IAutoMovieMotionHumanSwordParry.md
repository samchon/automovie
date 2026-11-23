# src/motion/human/lexicon/IAutoMovieMotionHumanSwordParry.ts#IAutoMovieMotionHumanSwordParry.Opening

## @evidence contracts/development/common.md#meaningful-documentation

The line a parry closes when it answers no attack: high or low, on the blade hand's side (`outside`) or across the body.

## @evidence contracts/development/design.md#principled-representation

Closed choices "highOutside", "highInside", "lowOutside", "lowInside" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSwordParry.ts (HumanSwordParry.meet).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanSwordParry.meet.

# src/motion/human/lexicon/IAutoMovieMotionHumanSwordParry.ts#IAutoMovieMotionHumanSwordParry.IParry

## @evidence contracts/development/common.md#meaningful-documentation

against: The anchor of the cut or thrust it meets; a drill to `line` when absent. line: The line closed when it answers no attack; `highOutside` when absent. hold: Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; as long as the stopped attack stays where it was met when absent, none for a drill. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

against: The anchor of the cut or thrust it meets; a drill to `line` when absent. line: The line closed when it answers no attack; `highOutside` when absent. hold: Seconds the blades stay together after they meet: a beat leaves at once, a bind stays; as long as the stopped attack stays where it was met when absent, none for a drill. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSwordParry.ts (HumanSwordParry.meet, context); lexicon/HumanSwordParry.ts (HumanSwordParry.parry, context); lexicon/HumanSwordParry.ts (HumanSwordParry.meet); lexicon/HumanSwordParry.ts (HumanSwordParry.parry).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSwordParry.Opening identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanSwordParry.ts#IAutoMovieMotionHumanSwordParry.ITaken

## @evidence contracts/development/common.md#meaningful-documentation

against: The anchor of the parry that took the blade. until: The anchor of the action whose end it is held to; that parry's own end when absent.

## @evidence contracts/development/design.md#principled-representation

against: The anchor of the parry that took the blade. until: The anchor of the action whose end it is held to; that parry's own end when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSwordTaken.ts (HumanSwordTaken.taken, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The parrying blade is read from the performance through the parry's anchor, never restated here.
