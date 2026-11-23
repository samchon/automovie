# src/motion/human/everyday/IAutoMovieMotionHumanBrace.ts#IAutoMovieMotionHumanBrace

## @evidence contracts/development/common.md#meaningful-documentation

target: Where the force comes from; straight ahead when absent. kind: What is braced for; `impact` when absent. hold: How long the brace lasts, seconds; 1.5 when absent.

## @evidence contracts/development/design.md#principled-representation

target: Where the force comes from; straight ahead when absent. kind: What is braced for; `impact` when absent. hold: How long the brace lasts, seconds; 1.5 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.brace, params); everyday/brace.ts (brace.plan, context); everyday/brace.ts (brace.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/everyday/IAutoMovieMotionHumanBrace.ts#IAutoMovieMotionHumanBrace.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its meaning, unit and the default an absent value takes.

## @evidence contracts/development/design.md#principled-representation

The source is the shared motion target union, read once at the start and projected to the floor; the kind is a closed union selecting the palms' facing; the duration is seconds, raised to at least the set time plus 0.2 s by the plan rather than refused.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by this law and read only by its plan; the target type is imported from the interface package.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names a scene or body, and every combination is meaningful.
