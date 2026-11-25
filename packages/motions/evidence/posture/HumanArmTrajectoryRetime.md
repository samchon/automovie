# src/posture/HumanArmTrajectoryRetime.ts#HumanArmTrajectoryRetime.timing

## @evidence contracts/development/common.md#meaningful-documentation

States the context, the course and the parameterisation and time map returned.

## @evidence contracts/development/implementation.md#principled-implementation

TOPP-RA (`HumanPathParameterization`, Pham and Pham 2018) on the course's own path, its parameter the course's seconds, at rest at both ends, under two `LinearJointVelocity` constraints. Each joint coordinate is held within `HUMAN_ARM_COORDINATE_RATES` (Herneth, Ganguly and Haddadin 2024; Williams et al. 2019). Each speed-bounded probe's place against its base is held within the law's pace. The path derivatives are the minimum-jerk path's (`HumanMinimumJerkSpline`), the curve the course plays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Path derivatives, probe derivatives, one TOPP-RA call, its time map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limits are the published rates and the law's pace; TOPP-RA's constants are its own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One placement per arm and instant, linear-time spline solves, and TOPP-RA's linear passes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per laid course refused for its speed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the time map only.

# src/posture/HumanArmTrajectoryRetime.ts#HumanArmTrajectoryRetime.retimed

## @evidence contracts/development/common.md#meaningful-documentation

States the course, its time map, the span and the coordinates returned.

## @evidence contracts/development/implementation.md#principled-implementation

The time map is slowed uniformly to the span (Hollerbach 1984: every rate divided by the span's ratio to the least, so every limit still holds). It is read at each instant as TOPP-RA's `ConstAccel::evalParams` reads it, and the course's minimum-jerk path is read there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solved path per arm and one reading per instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant; the caller reads the retimed course again in full before keeping it.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(instants × knots) for the searches and O(instants × coordinates) for the readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per retime.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh coordinates.

# src/posture/HumanArmTrajectoryRetime.ts#HumanArmTrajectoryRetime.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

status: how TOPP-RA ended. timed: its time map.

## @evidence contracts/development/design.md#principled-representation

TOPP-RA's return code beside its `ConstAccel` time map.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/planHumanArmTrajectory.ts (the speed case).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing derived is stored.
