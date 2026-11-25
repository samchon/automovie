# src/motion/human/handling/IAutoMovieMotionHumanHandshake.ts#IAutoMovieMotionHumanHandshake.IParams

## @evidence contracts/development/common.md#meaningful-documentation

hand: The shaking hand; `right` when absent. count: Pump cycles; 2 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#principled-representation

hand: The shaking hand; `right` when absent. count: Pump cycles; 2 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/HumanMutual.ts (HumanMutual.handshake, params); chain/HumanChainMutual.ts (HumanChainMutual.handshake, params); handling/handshake.ts (handshake.plan, context); HumanChain.ts (HumanChain.pair, return); HumanChain.ts (HumanChain.pair, params); actions/HumanMutual.ts (HumanMutual.handshake).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanHandshake.ts#IAutoMovieMotionHumanHandshake.IStance

## @evidence contracts/development/common.md#meaningful-documentation

height: How high the shoulder joint stands above the floor, metres. sternum: How far the sternum region lies ahead of the floor point, metres. shoulder: How far the shoulder joint lies ahead of the floor point, metres.

## @evidence contracts/development/design.md#principled-representation

height: How high the shoulder joint stands above the floor, metres. sternum: How far the sternum region lies ahead of the floor point, metres. shoulder: How far the shoulder joint lies ahead of the floor point, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/handshake.ts (handshake.stance, return); handling/handshake.ts (handshake.gap.elbow, stood); handling/handshake.ts (handshake.gap).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in handshake.stance.
