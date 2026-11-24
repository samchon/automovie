# src/physics/physicalIcpPlannerSegments.ts#physicalIcpPlannerSegments.ICopies

## @evidence contracts/development/common.md#meaningful-documentation

Documents the five boundary points the trajectory holds per frame.

## @evidence contracts/development/design.md#principled-representation

The reference's per-frame copies (`...InitialFrame` and `...FinalFrame`, l.54-80) as one shape over the point and state types of the frame they are in: sole-local points and attached states, or floor points and states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used for `ISegments.sole` and `ISegments.world`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes; the type parameters name the coordinates, not alternatives.

# src/physics/physicalIcpPlannerSegments.ts#physicalIcpPlannerSegments.ISegments

## @evidence contracts/development/common.md#meaningful-documentation

Documents every field of the initialized trajectory with units and timebase, seconds into single support.

## @evidence contracts/development/design.md#principled-representation

The state `ICPPlannerSegmentedTrajectoryGenerator.initialize` leaves (l.214-289) as plain data: the times, and each boundary point held in the support sole's coordinates and in the world, as the reference holds them. The CoM members the reference also keeps are absent because the planner's consumers read only the capture point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `initialize`, held in `physicalIcpPlanner.ISinglePlan` and read by `compute`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerSegments.ts#physicalIcpPlannerSegments.initialize

## @evidence contracts/development/common.md#meaningful-documentation

States the cubic's placement around the pivot switch, both minimum-time branches, its boundary states and the sole copies.

## @evidence contracts/development/implementation.md#principled-implementation

A line-by-line port of `initialize` (l.214-289) with `setReferenceFrames` (l.167-171) and `setTrajectoryTime` (l.173-178): the boundary states computed on the floor, each also expressed in the support sole's frame as it is when the plan is made (l.216-221). The reference computes the two copies separately in their frames; the divergence commutes with the frame's rigid transform, so expressing the floor result is the same point. The minimum-time branch keeps the reference's `Math.min(..., 0.0)` for the start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The spline times, the floor copies from `capturePoint`, then their sole copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 0.5 centring and the 1e-5 and 0.1 s thresholds are the reference's constants. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerSegments.ts#physicalIcpPlannerSegments.compute

## @evidence contracts/development/common.md#meaningful-documentation

States the clamp, the three segments, the sole copies carried to the current sole and the progression blends.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `compute` (l.305-336), its segments (l.338-395), `updateSplineBoundaries` (l.404-418) and the frame interpolations (l.423-446): the sole copies carried to the support sole as it is now, both copies diverged and blended by the progression through single support outside the cubic, and the cubic run between its ends blended by their own progressions. A slipping sole therefore stretches the plan as the reference's does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The copies carried by one file-private helper, then one branch per segment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-7 total-time test is the reference's. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
