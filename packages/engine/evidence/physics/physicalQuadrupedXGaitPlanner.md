# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner

## @evidence contracts/development/common.md#meaningful-documentation

States the update's two parts, the timing rule, the late lift-off delay, where goals lie and why the rectangle stays fixed at zero velocity, and the goals' height.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `QuadrupedXGaitStepStream.process` (l.72-81) at zero planar velocity: `QuadrupedPlanarFootstepPlan.updateCurrentSteps` (l.32-42), then `QuadrupedXGaitPlanner.computeOnlinePlan` (l.114-180) with `QuadrupedXGaitTools.computeStepTimeInterval` (l.11-37). The body path is `QuadrupedConstantVelocityBodyPathProvider` at zero velocity, whose extrapolation is the identity (l.147-152); its footstep-status re-anchoring (l.167-198) recentres on the latest started step's goal minus that corner's offset, which is the rectangle's own centre, and its achieved-adjustment shift never runs in 201903 because `recomputeStepAdjustment` is never set. Goals take the ground's height as the teleop's planar ground snapper does (l.32-48).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The current-step update, then the online plan in a helper; the corner and settling rules are helpers shared with `entry`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every constant is the reference's, cited at its declaration; the stance is the caller's body. The setters' size clamp (`YoQuadrupedXGaitSettings` l.47-50 and l.109-117) is left out by decision: its ranges are the reference robot's size limits, not part of the gait law, and the header and `settle` record the omission. Restricting the port to zero velocity and to a ground of one height is the stated scope, not a compensation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the 16 previewed steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the state, whose preview is fixed at 16 steps.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner

## @evidence contracts/development/common.md#meaningful-documentation

Documents the settings, state, defaults and entries.

## @evidence contracts/development/design.md#principled-representation

The reference's xGait settings, its zero-velocity rectangle and footstep plan, in metres, seconds and degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the integrator's quadruped phase reads the steps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The settings are partial only at entry, over the generic timing.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner.End

## @evidence contracts/development/common.md#meaningful-documentation

Names a robot end.

## @evidence contracts/development/design.md#principled-representation

`RobotEnd` as a literal union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keys the current steps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner.ISettings

## @evidence contracts/development/common.md#meaningful-documentation

Documents each setting with its unit and the phase's gait meanings.

## @evidence contracts/development/design.md#principled-representation

`QuadrupedXGaitSettingsReadOnly`'s six values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the planner; the generic timing is the default.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner.IRectangle

## @evidence contracts/development/common.md#meaningful-documentation

Documents the centre and heading.

## @evidence contracts/development/design.md#principled-representation

The reference's `xGaitRectangleFrame` pose, planar as its height is zero (l.196-202).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept in the state and read by the corner rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents the settled settings, the rectangle, the current steps and the preview.

## @evidence contracts/development/design.md#principled-representation

`QuadrupedPlanarFootstepPlan`'s current and planned steps with the stream's settings and body path pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `entry`, advanced by the update and read by `steps`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner.entry

## @evidence contracts/development/common.md#meaningful-documentation

States the settling, the first lift-off's delay and leg, the current steps and the closing update.

## @evidence contracts/development/implementation.md#principled-implementation

`QuadrupedXGaitStepStream.onEntry` (l.60-70): `updateXGaitSettings` at zero velocity (l.48-58), raising the stance to the minimum clearance, `computeInitialPlan` (l.48-112) from the support frame `QuadrupedConstantVelocityBodyPathProvider` takes at its first query (l.159-165), `initializeCurrentStepsFromPlannedSteps` (l.23-30), then `process`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Settle, plan, take the current steps, update.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both current steps are seeded from the first planned step before the first two steps overwrite them; the gait order alternates ends, so both are overwritten.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the 16 previewed steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedXGaitPlanner.ts#physicalQuadrupedXGaitPlanner.steps

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the landing filter.

## @evidence contracts/development/implementation.md#principled-implementation

`getCompleteStepSequence` (l.54-75), the ends in `RobotEnd.values` order, hind then front (RobotEnd l.7-9).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the 18 steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
