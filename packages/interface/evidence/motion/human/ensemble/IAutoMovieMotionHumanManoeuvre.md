# src/motion/human/ensemble/IAutoMovieMotionHumanManoeuvre.ts#IAutoMovieMotionHumanManoeuvre

## @evidence contracts/development/common.md#meaningful-documentation

States what a manoeuvre is, its four choices, where drills live and how a part is performed. arrive: What each rank does on arrival: the front, the rear or every rank stands or kneels; stands when absent. member: The member's index. delay: Seconds after the word it steps off, before its own latency.

## @evidence contracts/development/design.md#principled-representation

Two formations, a rule as four closed unions, the instant of the word and the travel; a part is a member's slot, delay, way and arrival. arrive: What each rank does on arrival: the front, the rear or every rank stands or kneels; stands when absent. member: The member's index. delay: Seconds after the word it steps off, before its own latency.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanManoeuvre.plan` reads and returns. Runtime boundary references: ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan, manoeuvre); ensemble/HumanManoeuvre.ts (HumanManoeuvre.append, manoeuvre); ensemble/HumanManoeuvre.ts (flanked, manoeuvre); ensemble/HumanManoeuvre.ts (travelSpeeds, manoeuvre); ensemble/HumanManoeuvre.ts (steered, manoeuvre); ensemble/manoeuvreWheel.ts (manoeuvreWheel, manoeuvre).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A drill is a row over the four primitives, never code of its own. Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IStation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanManoeuvre.ts#IAutoMovieMotionHumanManoeuvre.Row

## @evidence contracts/development/common.md#meaningful-documentation

The drills `HUMAN_MANOEUVRES` holds.

## @evidence contracts/development/design.md#principled-representation

Closed choices "wheel", "deploy", "ploy", "square", "extend", "close", "face", "free" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HUMAN_MANOEUVRES.ts (HUMAN_MANOEUVRES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HUMAN_MANOEUVRES.

# src/motion/human/ensemble/IAutoMovieMotionHumanManoeuvre.ts#IAutoMovieMotionHumanManoeuvre.IRule

## @evidence contracts/development/common.md#meaningful-documentation

arrive: What each rank does on arrival: the front, the rear or every rank stands or kneels; stands when absent.

## @evidence contracts/development/design.md#principled-representation

arrive: What each rank does on arrival: the front, the rear or every rank stands or kneels; stands when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan); ensemble/HUMAN_MANOEUVRES.ts (HUMAN_MANOEUVRES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Assignment, path, step-off ordering and arrival posture remain independent closed decisions; HumanManoeuvre.plan applies them rather than branching on catalogue names.

# src/motion/human/ensemble/IAutoMovieMotionHumanManoeuvre.ts#IAutoMovieMotionHumanManoeuvre.IPart

## @evidence contracts/development/common.md#meaningful-documentation

member: The member's index. delay: Seconds after the word it steps off, before its own latency. via: Its way, from its old slot to its new one, world metres.

## @evidence contracts/development/design.md#principled-representation

member: The member's index. delay: Seconds after the word it steps off, before its own latency. via: Its way, from its old slot to its new one, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan.parts, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.append, part); ensemble/HumanManoeuvre.ts (crossings, parts); ensemble/HumanManoeuvre.ts (crossings.lengths, p); ensemble/HumanManoeuvre.ts (crossings.end, p).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IStation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
