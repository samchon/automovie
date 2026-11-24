# src/physics/physicalBipedDesired.ts#physicalBipedDesired

## @evidence contracts/development/common.md#meaningful-documentation

States the planner's role, why the authored motion plays it, and the three recovery phases with their IHMC 201903 sources.

## @evidence contracts/development/design.md#principled-representation

The stored plan inputs and the planned capture point, both the recovery state's own types, world x and z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the biped plan and touchdown phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Type aliases of the interface's records and the authored capture point's; no casts.

# src/physics/physicalBipedDesired.ts#physicalBipedDesired.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the sole frame's origin and heading.

## @evidence contracts/development/implementation.md#principled-implementation

The sole frame IHMC's planner attaches its points to: origin at the support endpoint, forward along the foot's latched or present rotation relative to its authored one, which faces +z, as the stance's heading is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The heading, then the frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read the foot's own segment and authored target, which exist for a support limb.

## @evidence contracts/development/implementation.md#efficient-algorithms

A constant number of rotations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one foot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBipedDesired.ts#physicalBipedDesired.foot

## @evidence contracts/development/common.md#meaningful-documentation

States the foot's fields and the outline's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The planner reads a foot as its side, its sole frame and its contact polygon in it (`physicalIcpPlannerCmps.IFoot`); the bone names the foot whose sole frame the plan rides on later (`soles`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The frame, then the outline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One footprint and hull per foot.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one foot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBipedDesired.ts#physicalBipedDesired.soles

## @evidence contracts/development/common.md#meaningful-documentation

States which feet give the frames and why they are read now.

## @evidence contracts/development/implementation.md#principled-implementation

The 201903 planner's points ride on the soles' frames as they are each update (`physicalIcpPlanner`, `ICPPlannerTrajectoryGenerator` l.80-85); the plan's own feet, by bone and side, give them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads each side's foot, which every stored plan holds: single support stores the support and the swing foot on opposite sides, the transfer and standing both feet.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two frames; no footprints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one update's feet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBipedDesired.ts#physicalBipedDesired.side

## @evidence contracts/development/common.md#meaningful-documentation

States the left axis and the comparison.

## @evidence contracts/development/implementation.md#principled-implementation

Left of the root's heading is up x forward; a foot left of the others' mean is the left one, as IHMC names a biped's feet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The heading, the mean, one sign.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads the root's authored target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one foot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBipedDesired.ts#physicalBipedDesired.build

## @evidence contracts/development/common.md#meaningful-documentation

States that the plan is rebuilt from its stored inputs.

## @evidence contracts/development/implementation.md#principled-implementation

The planner's builders are pure functions of their inputs (`physicalIcpPlanner`), so the plan rebuilt each update is the one made when its inputs were stored: single support from the support then the footstep, the transfer to standing from both feet by side, the support side, the last planned capture point and the centre of mass, standing from the soles as it began and its two ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One builder per phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read the inputs each phase stores and each side's foot.

## @evidence contracts/development/implementation.md#efficient-algorithms

One small plan per update.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Rebuilding keeps the state plain data for checkpoints; the plan is a few segments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBipedDesired.ts#physicalBipedDesired.advance

## @evidence contracts/development/common.md#meaningful-documentation

States the transitions and the result.

## @evidence contracts/development/implementation.md#principled-implementation

201903: the plan is evaluated on the soles as they are now; the transfer to standing is done when its plan is and the capture point is within 0.025 m of it (`TransferToStandingState.isDone` l.66-71), then standing re-plans by the cubic from the plan's last output (`StandingState.onEntry` l.88-98) to the authored capture point on the soles as STANDING begins; when the cubic is done the authored capture point is followed. A foot's outline in its sole frame is rigid, so standing keeps the transfer's outlines with the new frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

No plan, the transfer's end, the cubic's end, else the plan's output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads the soles, which the caller passes with every plan.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two plan evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
