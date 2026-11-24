# src/physics/physicalQuadrupedDcmController.ts#physicalQuadrupedDcmController

## @evidence contracts/development/common.md#meaningful-documentation

States the law, the default gains, why the PID's integral, derivative, output bound and rate limit drop out, and the frame.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `DivergentComponentOfMotionController.compute` (l.69-105) with its default gains (l.51-53). Each axis's `PIDController.compute` gets zero rates (l.92-94), so the derivative term multiplies a zero rate error; the zero integral gain clears the integrator (`AbstractPIDController` l.90-93); the output bound is infinite (`PIDController` l.31-32); and the setpoint's rate limit of `Double.MAX_VALUE` (l.30, l.55) never clips a finite step. The effort is then K_p (xi_d - xi) (`AbstractPDController` l.49).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the gains are the reference's defaults, overridable per axis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; with these gains the reference's integrator holds nothing either.

# src/physics/physicalQuadrupedDcmController.ts#physicalQuadrupedDcmController

## @evidence contracts/development/common.md#meaningful-documentation

Documents the default gains and their unit.

## @evidence contracts/development/design.md#principled-representation

The `_DcmPosition` proportional gains per axis, per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the controller and its callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
