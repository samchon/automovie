# src/motion/human/actions/IAutoMovieMotionHumanJumpAirborne.ts#IAutoMovieMotionHumanJumpAirborne

## @evidence contracts/development/common.md#meaningful-documentation

somersault: Somersault turns, whole or half; 0 when absent. Inclusive minimum: 0. Unit: dimensionless. twist: Twist turns, signed; 0 when absent. Unit: dimensionless. way: Which way the somersault turns; `forward` when absent.

## @evidence contracts/development/design.md#principled-representation

somersault: Somersault turns, whole or half; 0 when absent. Inclusive minimum: 0. Unit: dimensionless. twist: Twist turns, signed; 0 when absent. Unit: dimensionless. way: Which way the somersault turns; `forward` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jumpAirborne.ts (jumpAirborne.turning, rotation).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in jumpAirborne.turning.

# src/motion/human/actions/IAutoMovieMotionHumanJumpAirborne.ts#IAutoMovieMotionHumanJumpAirborne.IRotation

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, sign and default.

## @evidence contracts/development/design.md#principled-representation

Turns about the somersault and long axes and the way, as the author writes them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all read by `turning`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The way is a closed union.
