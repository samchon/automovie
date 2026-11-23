# src/motion/human/touch/IAutoMovieMotionHumanKiss.ts#IAutoMovieMotionHumanKiss

## @evidence contracts/development/common.md#meaningful-documentation

side: Which way the head turns for a cheek or the lips; `right` when absent. hold: Seconds the lips stay; `HOLD` when absent. pitch: The lean forward from the hips, degrees.

## @evidence contracts/development/design.md#principled-representation

side: Which way the head turns for a cheek or the lips; `right` when absent. hold: Seconds the lips stay; `HOLD` when absent. pitch: The lean forward from the hips, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/HumanMutual.ts (HumanMutual.kiss, params); chain/HumanChainMutual.ts (HumanChainMutual.kiss, params); touch/kiss.ts (kiss.plan, context); touch/kiss.ts (kiss.solve, return); touch/kiss.ts (kiss.solve.miss, s); touch/kiss.ts (kiss.solve.least, candidates).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/touch/IAutoMovieMotionHumanKiss.ts#IAutoMovieMotionHumanKiss.HandRole

## @evidence contracts/development/common.md#meaningful-documentation

Names the two acting roles in the same meeting.

## @evidence contracts/development/design.md#principled-representation

One role writes the lips and one brings the hand to their common point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mutual action sets this role and the kiss law reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing role keeps the direct kiss's independently authored partner target.

# src/motion/human/touch/IAutoMovieMotionHumanKiss.ts#IAutoMovieMotionHumanKiss.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The partner and region as the target union's person case, the turn side as a closed union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's regions.

# src/motion/human/touch/IAutoMovieMotionHumanKiss.ts#IAutoMovieMotionHumanKiss.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The movement's four angles, supported vertical travel and measured distance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fitted key and the distance the verdict reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The miss is a member, so an unreachable target is reported and not hidden.
