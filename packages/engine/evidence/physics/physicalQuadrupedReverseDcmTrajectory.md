# src/physics/physicalQuadrupedReverseDcmTrajectory.ts#physicalQuadrupedReverseDcmTrajectory

## @evidence contracts/development/common.md#meaningful-documentation

States the pendulum's dynamics, the backward recursion, the height floor and the buffer error.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `PiecewiseReverseDcmTrajectory.initializeTrajectory` (l.102-134): each virtual repellent point is its centre of pressure raised by the height, and the closed-form solution of xi' = omega (xi - vrp) is applied backward from the final DCM (l.125-131). The height is floored at 1 mm (l.47, l.172).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Raise the points, then one backward loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The non-null assertions index arrays inside their checked lengths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the intervals, at most 50.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedReverseDcmTrajectory.ts#physicalQuadrupedReverseDcmTrajectory

## @evidence contracts/development/common.md#meaningful-documentation

Documents the trajectory, its sample, the capacity and the evaluation.

## @evidence contracts/development/design.md#principled-representation

The reference's corner points and times with the pendulum's frequency.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the DCM planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedReverseDcmTrajectory.ts#physicalQuadrupedReverseDcmTrajectory.ITrajectory

## @evidence contracts/development/common.md#meaningful-documentation

Documents each array's meaning, unit and length relation.

## @evidence contracts/development/design.md#principled-representation

`timesAtStartOfSteps`, `vrpCornerPoints` and `dcmCornerPoints`: one more time and DCM than points, times ascending as the contact sequence orders them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the trajectory and read by `evaluate`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required; the length relation is runtime state.

# src/physics/physicalQuadrupedReverseDcmTrajectory.ts#physicalQuadrupedReverseDcmTrajectory.ISample

## @evidence contracts/development/common.md#meaningful-documentation

Documents the DCM and its rate with units.

## @evidence contracts/development/design.md#principled-representation

The reference's `dcmPosition` and `dcmVelocity` at a time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the DCM planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedReverseDcmTrajectory.ts#physicalQuadrupedReverseDcmTrajectory.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

States the clamping, the interval's solution and its rate.

## @evidence contracts/development/implementation.md#principled-implementation

`computeTrajectory` (l.143-163): the time clamped to the span, the last interval started, Euclid's `interpolate` (1 - e) vrp + e xi_i with e = exp(omega (t - t_i)), and the rate omega (xi - vrp).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clamp, find the interval, evaluate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A time that is not a number evaluates interval 0 to not a number, where the reference keeps its last values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the intervals for the search, at most 50.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
