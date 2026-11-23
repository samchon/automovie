# src/motion/human/touch/IAutoMovieMotionHumanHighFive.ts#IAutoMovieMotionHumanHighFive

## @evidence contracts/development/common.md#meaningful-documentation

kind: The variant; `high` when absent. hand: The hand; `right` when absent. prop: The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent.

## @evidence contracts/development/design.md#principled-representation

kind: The variant; `high` when absent. hand: The hand; `right` when absent. prop: The subject id of the prop the hand holds, whose point meets the partner's in place of the hand: two glasses clinked in a toast. No prop when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/HumanMutual.ts (HumanMutual.highFive, params); chain/HumanChainMutual.ts (HumanChainMutual.highFive, params); touch/highFive.ts (highFive.plan, context); touch/highFive.ts (highFive.meeting, kind); actions/HumanMutual.ts (HumanMutual.highFive); touch/highFive.ts (highFive.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieMotionMeeting.IWindow, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/touch/IAutoMovieMotionHumanHighFive.ts#IAutoMovieMotionHumanHighFive.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The partner, the variant and the hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The variant is a closed union.

# src/motion/human/touch/IAutoMovieMotionHumanHighFive.ts#IAutoMovieMotionHumanHighFive.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The meeting kind of a variant for a hand. The variants.

## @evidence contracts/development/design.md#principled-representation

Closed choices "high", "low", "fist" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: touch/highFive.ts (highFive.meeting, kind); touch/highFive.ts (highFive.HEIGHTS); touch/highFive.ts (highFive.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in highFive.meeting.
