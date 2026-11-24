# src/physics/physicalBalancePlan.ts#physicalBalancePlan

## @evidence contracts/development/common.md#meaningful-documentation

States the phase's three outputs, the pendulum's rate, the plan's capture point and the assessment, that one phase serves every body whatever its contacts, that stepping is the prepared span's, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

The rate is IHMC's omega0 = sqrt(g / z0) held from the first update (201903 `HighLevelHumanoidControllerToolbox` l.155, l.204; `WalkingControllerParameters.getOmega0` l.45-51); the setpoint is the authored capture point (`physicalAuthoredCapture`), the authored motion playing the planner's role; the assessment is the capture point against the planted contacts' convex hull (`physicalSupportSpanContacts.hull`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One straight pass: the held rate, the setpoint, the hull, the assessment; no branch on a limb count or an anatomy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts, caches or fallbacks; with no planted contact the capture point lies infinitely outside, the stated premise of an empty support, and the state is unrecoverable only after a failed landing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the planted contacts' witnesses with one hull, n log n.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the held rate and setpoint live in the caller's state.
