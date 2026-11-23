# src/motion/IAutoMovieSpringParams.ts#IAutoMovieSpringParams

## @evidence contracts/development/design.md#principled-representation

These coefficients parameterize acceleration=k(target-current)-c*velocity in dampedSpring's unit-mass equation; nonnegative values allow zero restoring force or zero damping.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record holds only the two physical coefficients; current value, velocity, target and timestep belong to each integration step.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No joint, body or preferred timestep is encoded in this generic scalar parameter record; stability depends on the caller's coefficients and timestep.

## @evidence contracts/development/common.md#meaningful-documentation

Gives coefficient units, finite nonnegative domain and the unit-mass interpretation needed to choose a timestep.
