# src/motion/human/handling/IAutoMovieMotionHumanCarryHang.ts#IAutoMovieMotionHumanCarryHang

## @evidence contracts/development/common.md#meaningful-documentation

left: The prop the left hand holds; that arm is left to the walk when absent. right: The prop the right hand holds; that arm is left to the walk when absent. duration: Seconds the carry lasts; 3 when absent.

## @evidence contracts/development/design.md#principled-representation

left: The prop the left hand holds; that arm is left to the walk when absent. right: The prop the right hand holds; that arm is left to the walk when absent. duration: Seconds the carry lasts; 3 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/carryHang.ts (carryHang.plan, context); handling/carryHang.ts (carryHang.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in carryHang.plan.

# src/motion/human/handling/IAutoMovieMotionHumanCarryHang.ts#IAutoMovieMotionHumanCarryHang.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The props held in each hand and how long the carry lasts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A hand with no prop is left to the walk.
