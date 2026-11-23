# src/motion/human/everyday/IAutoMovieMotionHumanShift.ts#IAutoMovieMotionHumanShift.IParams

## @evidence contracts/development/common.md#meaningful-documentation

by: Distance along the seat, metres; positive toward the performer's left. hold: Seconds to stay seated after setting down; 0.5 when absent.

## @evidence contracts/development/design.md#principled-representation

by: Distance along the seat, metres; positive toward the performer's left. hold: Seconds to stay seated after setting down; 0.5 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.shift, params); everyday/shift.ts (shift.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanChainPosture.shift.
