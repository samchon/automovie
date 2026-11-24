# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner

## @evidence contracts/development/common.md#meaningful-documentation

States the three plans of a one-step recovery, the frames their points ride on, the decay rule and why it only acts in single support, the floor coordinates and the timebase.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `ContinuousCMPBasedICPPlanner.compute` (201903, l.452-502) with `decayDesiredVelocityIfNeeded` (l.287-306) and `isDone` (l.643-650): the segmented trajectory on the support sole as it is now in single support with two pivots, otherwise the double-support cubic between its ends carried to their frames as they are now (`ICPPlannerTrajectoryGenerator.compute` l.80-85, the mid-feet frame rebuilt from the current soles), then the decay and the done test on the state's remaining time. The CMP and acceleration outputs are not produced; the controller derives its perfect CMP from the capture point and rate (`physicalIcpController`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan's variant picks the trajectory; the frames come from the soles given; decay and done are shared.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the plan.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.ISoles

## @evidence contracts/development/common.md#meaningful-documentation

Documents the two sole frames.

## @evidence contracts/development/design.md#principled-representation

The reference's `soleZUpFrames` on the floor as `physicalPlanarPolygon.IFrame`, from which the support sole, the transfer-from sole and the mid-feet frame follow.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Passed to the planner each update and to `standing`; `toStanding` takes them inside its feet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.IAttachment

## @evidence contracts/development/common.md#meaningful-documentation

Documents the frames a double-support end rides on.

## @evidence contracts/development/design.md#principled-representation

A closed union of the three frames `initializeTransferTrajectory` attaches to (l.517-538): either sole or the mid-feet frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Held in `ITransferPlan` and resolved by the planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.
# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.ISinglePlan

## @evidence contracts/development/common.md#meaningful-documentation

Documents the variant tag, the support side, the swing duration, the decay and the trajectory.

## @evidence contracts/development/design.md#principled-representation

A single-support plan as plain data, seconds since the step's start; the support side names the sole the trajectory rides on; the discriminant separates it from double support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `singleSupport` and evaluated by the planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.ITransferPlan

## @evidence contracts/development/common.md#meaningful-documentation

Documents the variant tag, the transfer duration, the decay, the cubic's duration, its two attached ends and the mid-feet fallback.

## @evidence contracts/development/design.md#principled-representation

A double-support plan as plain data, the hold before standing or standing itself; both are the reference's double-support generator, its ends held in the frames they are attached to (`setInitialConditions`, `setFinalConditions` l.44-64), named by `IAttachment`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `toStanding` and `standing` and evaluated by the planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

Documents the plan union.

## @evidence contracts/development/design.md#principled-representation

A discriminated union of the reference planner's two trajectory sources, single and double support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The planner's input and the type the caller stores between updates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes; the variants are a union, not optional fields.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Documents the desired capture point, its rate and the done flag with units.

## @evidence contracts/development/design.md#principled-representation

The planner outputs the ICP controller reads (`getDesiredCapturePointPosition`, `getDesiredCapturePointVelocity`) and the state's `isDone`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the planner, read by its caller, `toStandingDone` and `standing`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.IParameters

## @evidence contracts/development/common.md#meaningful-documentation

Documents every timing, split, spline, decay, hold and exit parameter with units; `DEFAULTS` documents each value's source in a table.

## @evidence contracts/development/design.md#principled-representation

The planner and walking-state values the one-step recovery reads, extending the pivot parameters; the structural choice of two pivots per support is fixed by the implementation, not a parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the builders through partial overrides of `DEFAULTS`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.singleSupport

## @evidence contracts/development/common.md#meaningful-documentation

States which walking state builds it, the pivots, the timing arrays and the time origin.

## @evidence contracts/development/implementation.md#principled-implementation

A port of the single-support path for one registered step: `initializeForSingleSupport` (l.372-392), `updateSingleSupportPlan` (l.418-434), the calculator's single-support pivots (l.404-439) and `initializeSwingTrajectory` (l.667-707). With three steps considered the arrays hold the step, no later swing and the final transfer (l.382-387), and the final pivot repeats (l.489-495); more steps considered give the same plan. The entry pivot uses no previous transfer, as a recovery from standing has none (l.413-414). The trajectory's points are held on the support sole and in the world, as the reference's generator holds them (l.701).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pivots, corner points, initial capture point, then the segmented trajectory, each from its owner module.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every value comes from `DEFAULTS` or the caller. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

The feet's hulls, linear-logarithmic in their vertices; the rest constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.toStanding

## @evidence contracts/development/common.md#meaningful-documentation

States the hold point's construction, the frames its ends ride on, its duration and the time origin.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `TransferToStandingState.onEntry` (l.73-117) through `BalanceManager.initializeICPPlanForTransferToStanding` (l.688-700) with the hold requested by the recovery step (`WalkingSingleSupportState` l.270-274): `requestICPPlannerToHoldCurrentCoM` (l.815-829) projects the centre of mass onto the feet's support shrunk by 8 cm, and `initializeTransferTrajectory`'s hold branch (l.543-555) sets the desired capture point there at rest for the final transfer. Its start rides on the mid-feet frame or the transfer-from sole, whichever origin the last desired capture point is nearer (l.524-537), its end on the mid-feet frame (l.538). The support is built in the left sole's frame, a rigid copy of the reference's mid-feet one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The joint support, the projection, then the shared double-support builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear-logarithmic in the feet's vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.toStandingDone

## @evidence contracts/development/common.md#meaningful-documentation

States the two conditions of the exit test.

## @evidence contracts/development/implementation.md#principled-implementation

`TransferToStandingState.isDone` (l.64-71): the plan done and the capture point's distance to the desired one under 2.5 cm (l.42).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two conditions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlanner.ts#physicalIcpPlanner.standing

## @evidence contracts/development/common.md#meaningful-documentation

States the cubic's start, its caller-given target, the reference's own target, the mid-feet frame both ride on and what happens after the cubic.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `StandingState.onEntry` (l.82-93) through `initializeForStanding` (l.321-330) and `initializeTransferTrajectory` (l.556-564, l.616-620): the double-support cubic from the planner's last desired capture point and rate over the final transfer, both ends on the mid-feet frame (l.520-523, l.538). The reference ends it at the final pivot between the feet at rest; by the project's mapping the authored motion plays the planner while standing, so the end point and rate are the caller's input, the authored capture point when STANDING begins. The cubic itself is the ported `VelocityConstrainedPositionTrajectoryGenerator`, at rest at its end point afterwards; following the live authored capture point after it is the caller's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared double-support builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. The caller-given target is the project's documented mapping, not a compensation. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
