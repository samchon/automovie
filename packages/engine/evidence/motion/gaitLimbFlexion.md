# src/motion/gaitLimbFlexion.ts#gaitLimbFlexion

## @evidence contracts/development/implementation.md#principled-implementation

Wraps t/period+phase into [0,1), splits at duty in (0,1), and interpolates opposite amplitude endpoints through stance/swing easing; the same scalar law can drive the gait row's selected clinical axis despite this legacy function name.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One piecewise scalar evaluator owns the phase/duty law; gaitMotion owns bone/axis aggregation and cubicBezierEasing owns parameterized easing inversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid period, phase, duty, amplitude or authored neutral throws; no body or named gait is special-cased. Finite sample time and CSS-legal easing controls remain the caller's admitted input premise.

## @evidence contracts/development/common.md#meaningful-documentation

Gives degrees/seconds, wrapped phase, neutral default and the independent stance/swing easing meaning without guaranteeing a custom rig's ROM.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar operations plus one bounded easing evaluation takes constant time and auxiliary space per limb row.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the selected stance or swing easing is evaluated at the current phase; no sampled trajectory is cached across mutable gait rows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one angle and retains no gait row, frame history or external resource.
