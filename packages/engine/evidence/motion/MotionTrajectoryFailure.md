# src/motion/MotionTrajectoryFailure.ts#MotionTrajectoryFailure

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the existing time-resolution guard from model errors and identifies seconds, normalized estimates, actual angular RHS endpoints and an optional copied physical probe. The guard includes its original roundoff margin, not only t+h equal to t.

## @evidence contracts/development/design.md#principled-representation

An Error subtype exposes the last trial's numeric quantities and optional admitted symbol. An enclosing operation matches its unique token before enriching this error, so a nested model's same-class failure is not mistaken for this integration's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

MotionTrajectoryStepper produces the failure; the airborne wrapper adds matching physical context and the motions flight pass adds its actual boundary shape. The package export lets both consumers select the type and their operation token without a private import or runtime observer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The token's type is admitted but changes no numerical admission or recovery. The producer copies declared numeric components only, without RHS, shape, model or history; a failed trial is reported rather than an assumed physical diagnosis.
