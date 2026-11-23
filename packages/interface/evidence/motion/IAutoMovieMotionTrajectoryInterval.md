# src/motion/IAutoMovieMotionTrajectoryInterval.ts#IAutoMovieMotionTrajectoryInterval

## @evidence contracts/development/common.md#meaningful-documentation

Each member identifies its knot time, state vector or endpoint derivative.

## @evidence contracts/development/design.md#principled-representation

Adjacent stored states and right-hand-side derivatives define the actual cubic vector interpolant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The physical departure certificate needs actual dense coefficients without reconstructing them through rounded interpolation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All arrays are fresh copies; callers cannot change retained integration knots through this record.
