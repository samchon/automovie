# src/motion/human/striking/IAutoMovieMotionHumanStrikingBlade.ts#IAutoMovieMotionHumanStrikingBlade.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

offset: Its grip socket from the first hand's, metres: `x` along the tool's axis, `y` along its edge, `z` along their cross product.

## @evidence contracts/development/design.md#principled-representation

offset: Its grip socket from the first hand's, metres: `x` along the tool's axis, `y` along its edge, `z` along their cross product.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.supported, return); striking/StrikingSupport.ts (StrikingSupport.goal, support); striking/StrikingSupport.ts (StrikingSupport.posture, support).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingBlade.ts#IAutoMovieMotionHumanStrikingBlade.IStroke

## @evidence contracts/development/common.md#meaningful-documentation

back: The point of the tool that must stay on its path where the wrist cannot turn as asked, metres behind the working point. support: Where the other hand holds the tool, or null when one hand holds it. decisive: The instant that is the action's decisive one; `stroke` when absent.

## @evidence contracts/development/design.md#principled-representation

back: The point of the tool that must stay on its path where the wrist cannot turn as asked, metres behind the working point. support: Where the other hand holds the tool, or null when one hand holds it. decisive: The instant that is the action's decisive one; `stroke` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingBlade.ts (StrikingBlade.plan, stroke); striking/StrikingBlade.ts (StrikingBlade.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionClock, IAutoMovieMotionHumanStrikingHeld.IHandFrame, IAutoMovieMotionHumanStrikingBlade.ISupport, IAutoMovieMotionHumanStrikingAdvance.Advance, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
