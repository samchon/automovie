# src/motion/IAutoMovieGaitLimb.ts#IAutoMovieGaitLimb

## @evidence contracts/development/design.md#principled-representation

A phase-shifted cycle divides at duty into stance and swing, each interpolating between opposite signed amplitudes about neutral; gaitLimbFlexion wraps phase, requires finite parameters and duty strictly between zero and one, and applies separate easing to the two intervals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One row drives one bone axis, defaulting to flexion, while gaitMotion folds different axes of a bone into one joint and refuses repeated bone-axis rows rather than overwriting them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Creature names do not select footfall timing or joint limits; phase and duty express nominal stance/swing timing without proving foot contact, and the resulting motion still faces the skeleton's range-of-motion validation. Finite cubic y controls may overshoot the amplitude endpoints; direct gait evaluation leaves CSS x-control admission to its caller.

## @evidence contracts/development/common.md#meaningful-documentation

Gives phase turns and wrapping, open duty bounds, degree amplitude and neutral, default axis and linear easing, cubic control ownership and the per-phase fallback when controls are absent.
