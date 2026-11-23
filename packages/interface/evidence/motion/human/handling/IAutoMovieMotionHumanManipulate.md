# src/motion/human/handling/IAutoMovieMotionHumanManipulate.ts#IAutoMovieMotionHumanManipulate.Finger

## @evidence contracts/development/common.md#meaningful-documentation

A digit of a hand.

## @evidence contracts/development/design.md#principled-representation

Closed choices "thumb", "index", "middle", "ring", "little" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/manipulate.ts (CHART, [keys, side, finger]); handling/manipulate.ts (CHART, return); handling/manipulateFingering.ts (manipulateFingering, return); handling/manipulate.ts (manipulate.FINGERS); handling/manipulate.ts (manipulate.sequence); handling/manipulate.ts (CHART).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in CHART.

# src/motion/human/handling/IAutoMovieMotionHumanManipulate.ts#IAutoMovieMotionHumanManipulate.IContact

## @evidence contracts/development/common.md#meaningful-documentation

digit: The digit that presses it; the fingering chooses when absent. hand: The hand; the act's `side` when absent, the right when both hands play. at: Seconds from the act's start to the press; every contact gives it or none does.

## @evidence contracts/development/design.md#principled-representation

digit: The digit that presses it; the fingering chooses when absent. hand: The hand; the act's `side` when absent, the right when both hands play. at: Seconds from the act's start to the press; every contact gives it or none does.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/manipulate.ts (manipulate.sequence.given, c).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanManipulate.Finger, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanManipulate.ts#IAutoMovieMotionHumanManipulate.IParams

## @evidence contracts/development/common.md#meaningful-documentation

prop: The prop pressed. contacts: The contacts, in order; or none with a `text`. text: A text typed on a keyboard prop (`createKeyboard`'s `homeRow` and `keys`), instead of `contacts`.

## @evidence contracts/development/design.md#principled-representation

prop: The prop pressed. contacts: The contacts, in order; or none with a `text`. text: A text typed on a keyboard prop (`createKeyboard`'s `homeRow` and `keys`), instead of `contacts`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/manipulate.ts (manipulate.plan, context); handling/manipulate.ts (manipulate.sequence, context); handling/manipulate.ts (interval, context); handling/manipulate.ts (typed, context); handling/manipulate.ts (manipulate.sequence); handling/manipulate.ts (interval).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanManipulate.IContact, AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanManipulate.ts#IAutoMovieMotionHumanManipulate.IPress

## @evidence contracts/development/common.md#meaningful-documentation

site: The site, world metres. time: Seconds from the act's start to the press. depth: How far the site gives, metres.

## @evidence contracts/development/design.md#principled-representation

site: The site, world metres. time: Seconds from the act's start to the press. depth: How far the site gives, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/manipulate.ts (manipulate.plan.wrist, p); handling/manipulate.ts (manipulate.plan.sides, p); handling/manipulate.ts (manipulate.plan, p); handling/manipulate.ts (manipulate.plan.mine, p); handling/manipulate.ts (manipulate.sequence, return); handling/manipulate.ts (manipulate.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanManipulate.Finger, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanManipulate.ts#IAutoMovieMotionHumanManipulate.IContactAt

## @evidence contracts/development/common.md#meaningful-documentation

point: The site, world metres. depth: The press depth, metres.

## @evidence contracts/development/design.md#principled-representation

point: The site, world metres. depth: The press depth, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/manipulate.ts (manipulate.sequence.given, return); handling/manipulate.ts (manipulate.sequence.timed, c); handling/manipulate.ts (manipulate.sequence.times, c); handling/manipulate.ts (manipulate.sequence.sides, c); handling/manipulate.ts (manipulate.sequence.placed, c); handling/manipulate.ts (manipulate.sequence, c).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
