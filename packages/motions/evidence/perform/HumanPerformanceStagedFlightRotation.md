# src/perform/HumanPerformanceStagedFlightRotation.ts#HumanPerformanceStagedFlightRotation

## @evidence contracts/development/common.md#meaningful-documentation

States film/action seconds, signed unwrapped revolutions, linear phase, current heading, centre/articulation preservation and absence of a physical-conservation claim. Invalid numeric spans, angles and frames refuse. The native jump can supply a checked turned stance. Other laws admit only whole turns.

## @evidence contracts/development/implementation.md#principled-implementation

The root-local curve is F Rx(360*s*u) Ry(360*t*u) F^-1 for the declared axis frame F and flight share u. Left multiplication by the current unturned root expresses the requested local attitude in world coordinates; the shared playback owner returns its relative rigid turn about the same COM. Rx(a)Ry(b) is identity in SO(3) exactly when both requested revolution counts are integers, so ordinary laws require complete cycles. A native turned landing checks the full returned rotation against its actual ground stance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capture each requested count and frame coordinate once, admit those exact finite scalars and phase closure, construct the analytic orientation reader from the same captures, then delegate numeric centre/root interpolation to the existing playback owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This is an explicit staged authoring policy, not a physical flight or a fabricated momentum result. Count/coordinate getters cannot supply one value for admission and another for the actual curve: all validation and construction consume the same owned scalar snapshot. It creates no history, inertia solve, take-off search, controller or conservation verdict, and preserves every requested winding without clipping or nearest-angle substitution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant setup plus constant quaternion work per playback query. The existing numeric table owns centre/root lookup; authored angle evaluation has no integration grid, iterations or state-dependent search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the actual numeric centre/root playback implementation with physical flights. Copied frame/turn/time scalars fix only this authored curve, with no pose, time-result cache, callback probing or cross-performance reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned playback owns numeric table data and a constant-size closure of copied frame, span and angle scalars. No performance, body, plan, shape callback, mass model or physical history survives in it.
