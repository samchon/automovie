# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.IWield

## @evidence contracts/development/common.md#meaningful-documentation

blade: The held blade's prop subject id; the bare hand when absent. hand: The hand that holds it; `right` when absent. tip: The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent.

## @evidence contracts/development/design.md#principled-representation

blade: The held blade's prop subject id; the bare hand when absent. hand: The hand that holds it; `right` when absent. tip: The affordance ids of the held thing's working point and of its edge, for an implement that is no blade (a bat's `barrel`, a racket's `face`, a club's `head`); `point` and `edge` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, context); lexicon/HumanSword.ts (HumanSword.setup).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.Line

## @evidence contracts/development/common.md#meaningful-documentation

Where a cut comes from, as the performer sees it: `forehand` is the blade hand's side.

## @evidence contracts/development/design.md#principled-representation

Closed choices "above", "aboveForehand", "forehand", "belowForehand", "below", "belowBackhand", "backhand", "aboveBackhand" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.LINES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanSword.LINES.

# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.IParts

## @evidence contracts/development/common.md#meaningful-documentation

out: Toward the blade hand's side. up: Up. forward: Forward.

## @evidence contracts/development/design.md#principled-representation

out: Toward the blade hand's side. up: Up. forward: Forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, parts); lexicon/HumanSword.ts (HumanSword.aim, place); lexicon/HumanSwordGuard.ts (HumanSwordGuard.GUARDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanSword.setup.

# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.IAttack

## @evidence contracts/development/common.md#meaningful-documentation

target: What it is aimed at; a place at the blade's reach ahead when absent. advance: How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm. outcome: Whether it lands or is stopped short for a parry to meet; `lands` when absent. taken: Whether the meeting parry takes the stopped blade, so the attack ends where it was stopped; false when absent.

## @evidence contracts/development/design.md#principled-representation

target: What it is aimed at; a place at the blade's reach ahead when absent. advance: How the body goes with it; when absent, the least of none, a step and a lunge that brings the target inside the arm. outcome: Whether it lands or is stopped short for a parry to meet; `lands` when absent. taken: Whether the meeting parry takes the stopped blade, so the attack ends where it was stopped; false when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim, context); lexicon/HumanSword.ts (HumanSword.stopped, params); lexicon/HumanSword.ts (HumanSword.taken, params); lexicon/HumanSwordParry.ts (HumanSwordParry.meet, taken); lexicon/HumanSwordThrust.ts (HumanSwordThrust.thrust, context); lexicon/HumanSwordTiming.ts (HumanSwordTiming.timed, context); lexicon/HumanSword.ts (HumanSword.aim); lexicon/HumanSwordThrust.ts (HumanSwordThrust.thrust).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanStrikingAdvance.Advance identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.ICut

## @evidence contracts/development/common.md#meaningful-documentation

from: Where the cut comes from; `above` when absent.

## @evidence contracts/development/design.md#principled-representation

from: Where the cut comes from; `above` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.cut, context); lexicon/HumanSword.ts (HumanSword.cut).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSword.Line identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.ISetup

## @evidence contracts/development/common.md#meaningful-documentation

support: Where the other hand holds the grip, or null for one hand. arm: The upper arm and the forearm together, metres. shoulder: The blade hand's shoulder joint at the entry, world metres.

## @evidence contracts/development/design.md#principled-representation

support: Where the other hand holds the grip, or null for one hand. arm: The upper arm and the forearm together, metres. shoulder: The blade hand's shoulder joint at the entry, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.setup, return); lexicon/HumanSword.ts (HumanSword.aim, s); lexicon/HumanSwordParry.ts (HumanSwordParry.meet, s); lexicon/HumanSword.ts (HumanSword.cut); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard); lexicon/HumanSwordParry.ts (HumanSwordParry.parry).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionHumanStrikingBlade.ISupport, IAutoMovieVector3, IAutoMovieMotionHumanSword.IParts identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanSword.ts#IAutoMovieMotionHumanSword.IAim

## @evidence contracts/development/common.md#meaningful-documentation

target: The point aimed at, world metres. yaw: That line's heading, degrees. travel: How far it carries the leading foot, metres: the least of its travel that brings the target within reach.

## @evidence contracts/development/design.md#principled-representation

target: The point aimed at, world metres. yaw: That line's heading, degrees. travel: How far it carries the leading foot, metres: the least of its travel that brings the target within reach.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanSword.ts (HumanSword.aim, return); lexicon/HumanSword.ts (HumanSword.cut); lexicon/HumanSwordThrust.ts (HumanSwordThrust.thrust).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanStrikingAdvance.Advance, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
