# src/physics/IAutoMoviePhysicalRecoveryState.ts#IAutoMoviePhysicalRecoveryState

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes pending steps, confirmed landings, authored handoffs, recovery clocks and mutable checkpoint ownership.

## @evidence contracts/development/design.md#principled-representation

Local-second history and world-metre offsets retain causal recovery ownership; resolved status distinguishes landing, cancellation and failure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance mutates this caller-owned state and checkpoint replay preserves the same history rather than reconstructing it from a requested goal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional history supports initially empty state; later landings cannot be treated as earlier support and revision only invalidates transient goals.

# src/physics/IAutoMoviePhysicalRecoveryState.ts#IAutoMoviePhysicalRecoveryState.Quadrant

## @evidence contracts/development/common.md#meaningful-documentation

Names the four legs as IHMC's `RobotQuadrant` does.

## @evidence contracts/development/design.md#principled-representation

A closed union of the four leg names the quadruped port keys its legs by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the quadruped gait's steps, adjustment and feet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

String literals only.

# src/physics/IAutoMoviePhysicalRecoveryState.ts#IAutoMoviePhysicalRecoveryState.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

Documents each axis against the world's.

## @evidence contracts/development/design.md#principled-representation

IHMC's z-up world frame, so the gait's points keep the frame the quadruped port computes in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the gait's steps, planner and adjustment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Three numbers, nothing else.

# src/physics/IAutoMoviePhysicalRecoveryState.ts#IAutoMoviePhysicalRecoveryState.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Documents each field of a quadruped step with its unit.

## @evidence contracts/development/design.md#principled-representation

IHMC's `QuadrupedTimedStep`: the leg, the goal, the clearance and the interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept by the gait's stream.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/IAutoMoviePhysicalRecoveryState.ts#IAutoMoviePhysicalRecoveryState.IGait

## @evidence contracts/development/common.md#meaningful-documentation

Documents each part of the quadruped's stepping state and its source class.

## @evidence contracts/development/design.md#principled-representation

The 201903 step controller's state as plain data: the quadrants, the xGait stream, the DCM planner, the step adjustment, each foot module's trigger and state time, and the halt, so a checkpoint resumes the gait exactly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by physicalQuadPlan, its adjustment and feet also by physicalQuadTouchdown, as IHMC's touchdown callback clears a step's adjustment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The halt is absent until the gait halts; the adjustment's target is not a number until its step is first updated, as the reference's is.
