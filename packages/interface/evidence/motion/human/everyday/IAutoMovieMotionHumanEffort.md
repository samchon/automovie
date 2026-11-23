# src/motion/human/everyday/IAutoMovieMotionHumanEffort.ts#IAutoMovieMotionHumanEffort.Action

## @evidence contracts/development/common.md#meaningful-documentation

Names the three factors combined by the eight action labels and the neutral flow.

## @evidence contracts/development/design.md#principled-representation

A closed literal vocabulary is independent of the runtime factor table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanEffort.ACTIONS is keyed by Action and manner preset lookup reads the same keys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No keyof typeof implementation dependency defines the admitted vocabulary.

# src/motion/human/everyday/IAutoMovieMotionHumanEffort.ts#IAutoMovieMotionHumanEffort.IEffort

## @evidence contracts/development/common.md#meaningful-documentation

weight: -1 light to 1 strong. time: -1 sustained to 1 sudden. space: -1 indirect to 1 direct.

## @evidence contracts/development/design.md#principled-representation

weight: -1 light to 1 strong. time: -1 sustained to 1 sudden. space: -1 indirect to 1 direct.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanEffort.ts (HumanEffort.modifiers, effort); everyday/HumanEffort.ts (HumanEffort.ACTIONS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanEffort.modifiers.

# src/motion/human/everyday/IAutoMovieMotionHumanEffort.ts#IAutoMovieMotionHumanEffort.IModifiers

## @evidence contracts/development/common.md#meaningful-documentation

curvature: Lateral path deviation, a share of the path length.

## @evidence contracts/development/design.md#principled-representation

curvature: Lateral path deviation, a share of the path length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanEffort.ts (HumanEffort.modifiers, return); compose/AutoMovieMotionManner.ts (AutoMovieMotionManner.resolve); everyday/approach.ts (approach.to); everyday/gesture.ts (gesture.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanEffort.modifiers.
