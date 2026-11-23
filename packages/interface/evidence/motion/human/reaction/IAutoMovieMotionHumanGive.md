# src/motion/human/reaction/IAutoMovieMotionHumanGive.ts#IAutoMovieMotionHumanGive.IParams

## @evidence contracts/development/common.md#meaningful-documentation

target: Where the contact comes from; a place ahead of the performer when absent. part: What gives way; `head` when absent. way: Whether the part goes away from the contact (a slap, a push) or toward it (a pull); `away` when absent.

## @evidence contracts/development/design.md#principled-representation

target: Where the contact comes from; a place ahead of the performer when absent. part: What gives way; `head` when absent. way: Whether the part goes away from the contact (a slap, a push) or toward it (a pull); `away` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: reaction/give.ts (give.plan, context); reaction/give.ts (give.turned, context); reaction/give.ts (give.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
