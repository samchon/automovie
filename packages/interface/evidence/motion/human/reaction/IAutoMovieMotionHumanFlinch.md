# src/motion/human/reaction/IAutoMovieMotionHumanFlinch.ts#IAutoMovieMotionHumanFlinch

## @evidence contracts/development/common.md#meaningful-documentation

target: Where the threat comes from; a place ahead of the performer when absent. intensity: How strong, in (0, 1]; 1 when absent.

## @evidence contracts/development/design.md#principled-representation

target: Where the threat comes from; a place ahead of the performer when absent. intensity: How strong, in (0, 1]; 1 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.flinch, params); reaction/flinch.ts (flinch.plan, context); reaction/flinch.ts (flinch.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/reaction/IAutoMovieMotionHumanFlinch.ts#IAutoMovieMotionHumanFlinch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Members state the threat target/default, intensity range/default and shared manner's explicit intensity precedence.

## @evidence contracts/development/design.md#principled-representation

The threat is the existing target union; optional intensity and shared manner feed the original modifier admission rather than another reaction-specific parameter record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Plan reads all three inputs: threat, optional top-level intensity and optional shared manner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the target union and shared manner contract without a performer-specific threat or replacement intensity rule.
