# src/motion/human/reaction/IAutoMovieMotionHumanPerturb.ts#IAutoMovieMotionHumanPerturb

## @evidence contracts/development/common.md#meaningful-documentation

outcome: The outcome: decided by the impulse (`auto`), or fixed by the author and refused when the impulse cannot produce it; `auto` when absent. on: The thrown body's region on the fulcrum, for a `thrown` outcome; the abdomen when absent (#3439).

## @evidence contracts/development/design.md#principled-representation

outcome: The outcome: decided by the impulse (`auto`), or fixed by the author and refused when the impulse cannot produce it; `auto` when absent. on: The thrown body's region on the fulcrum, for a `thrown` outcome; the abdomen when absent (#3439).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.perturb, params); reaction/perturb.ts (perturb.plan, context); reaction/perturb.ts (perturb.absorb, context); reaction/perturb.ts (perturb.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/reaction/IAutoMovieMotionHumanPerturb.ts#IAutoMovieMotionHumanPerturb.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the outcome's meaning and default.

## @evidence contracts/development/design.md#principled-representation

The outcome as a closed union, `auto` leaving it to the impulse.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one value the plan reads besides the forces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The impulse is not a parameter: it is the performance's force input.
