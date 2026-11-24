# src/physics/physicalBipedPlan.ts#physicalBipedPlan

## @evidence contracts/development/common.md#meaningful-documentation

States the planned capture point, the double- and single-support rules with their IHMC 201903 sources, the capture region's frame and inputs, the product policies that gate a step, and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The planned capture point is the recovery plan's on the soles as they are now, else the authored one (`physicalBipedDesired`); the standing state's entry resets the push recovery (201903 `StandingState` l.90). IHMC 201903's push recovery (`physicalPushRecovery`): in double support the plain capture point against the planned one, a fall swinging the farther foot at once with its footstep checked over the 0.6 s default swing (`WalkingSingleSupportState` l.204-216, `PushRecoveryControlModule` l.283-292), the single-support plan made from the support foot to the footstep (`initializeICPPlanForSingleSupport`); in single support the error test and the footstep checked again with the time left, the plan made again from now when the footstep moves (l.136-163). The region is the support sole's, its frame the support endpoint and its latched heading; the foot width and reach are this body's geometry. The swing foot takes the support's other side, as a biped's feet are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The capture point and support, the planned capture point, then double or single support, then the assessment; the footstep check and the plan's start are helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The swing time is the reference's, cited. Non-null assertions read the outside time set just before and the support's authored target. The reaction time, authored reservations and the failed-landing retry are the product's policy inputs, carried as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most twelve capture regions per substep through the preferred swing time, each linear in the support foot's vertices; one plan built and evaluated per substep, two at a transition or a new plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; a trigger adds one step record to the caller's state.

# src/physics/physicalBipedPlan.ts#physicalBipedPlan

## @evidence contracts/development/common.md#meaningful-documentation

Documents the swing time and the feet's side order.

## @evidence contracts/development/design.md#principled-representation

The swing time, seconds, and the feet's left-first order IHMC's sides use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.

# src/physics/physicalBipedPlan.ts#physicalBipedPlan.sides

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the left axis.

## @evidence contracts/development/implementation.md#principled-implementation

Left of the stance's heading is up x forward; the leftmost planted foot first, as `RobotSide.values` lists left first, ties by pattern order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

A sort of the planted feet.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It orders one stance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
