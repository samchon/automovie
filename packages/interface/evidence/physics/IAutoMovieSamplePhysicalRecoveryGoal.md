# src/physics/IAutoMovieSamplePhysicalRecoveryGoal.ts#IAutoMovieSamplePhysicalRecoveryGoal.IInput

## @evidence contracts/development/common.md#meaningful-documentation

One recovery swing plus the authored vertical baseline at the requested clock.

## @evidence contracts/development/design.md#principled-representation

Swing start/end and seconds share local seconds; point is world metres, velocity world m/s and height nonnegative metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

samplePhysicalRecoveryGoal borrows input and uses the swing's X/Z endpoints with the authored point.y and velocity.y; it allocates the sampled point and velocity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies a finite positive swing duration and admitted placements. Progress clamps to [0,1]; horizontal authored point/velocity components do not drive this trajectory.

# src/physics/IAutoMovieSamplePhysicalRecoveryGoal.ts#IAutoMovieSamplePhysicalRecoveryGoal.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Requested support point and analytic velocity on a recovery swing.

## @evidence contracts/development/design.md#principled-representation

point is world metres and velocity world m/s; X/Z follow quintic endpoint interpolation, Y adds sine clearance to the authored vertical baseline.

## @evidence contracts/development/design.md#minimal-and-owned-surface

samplePhysicalRecoveryGoal allocates both vectors; neither is a measurement of a native body or a landing receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Outside the swing the horizontal rate and added clearance rate are zero, while the authored vertical velocity remains. The caller owns admission of the swing and baseline.
