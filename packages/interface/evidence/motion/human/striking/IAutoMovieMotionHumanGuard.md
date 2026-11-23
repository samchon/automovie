# src/motion/human/striking/IAutoMovieMotionHumanGuard.ts#IAutoMovieMotionHumanGuard

## @evidence contracts/development/common.md#meaningful-documentation

duration: How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set. stance: Which side leads; the entry's leading side when absent. facing: What to face; the entry's line when absent.

## @evidence contracts/development/design.md#principled-representation

duration: How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set. stance: Which side leads; the entry's leading side when absent. facing: What to face; the entry's line when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.guard, params); striking/guard.ts (guard.plan, context); striking/guard.ts (guard.build, context); striking/guard.ts (guard.blendArms, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanGuard.ts#IAutoMovieMotionHumanGuard.Style

## @evidence contracts/development/common.md#meaningful-documentation

Describes how each choice places the gloves.

## @evidence contracts/development/design.md#principled-representation

A closed choice of sporting glove carriage, independent of the lead foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Guard and stepping parameters share the choice consumed by StrikingGuard.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names the supported choices at the interface and leaves joint and reach geometry to the motion law.

# src/motion/human/striking/IAutoMovieMotionHumanGuard.ts#IAutoMovieMotionHumanGuard.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, minimum or default.

## @evidence contracts/development/design.md#principled-representation

A duration in seconds (raised to the setting time when planning), a closed union of stances, and the interface's motion target to face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The timing, stance, style and target the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's target union.
