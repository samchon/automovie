# src/physics/physicalQuadPlan.ts#physicalQuadPlan

## @evidence contracts/development/common.md#meaningful-documentation

States the LIPM height, the standing setpoint, the reused trigger, stepping's entry and update, the halt and the end, each with its 201903 source, the known risk of the 0.5 s delay and the product policies.

## @evidence contracts/development/implementation.md#principled-implementation

201903's quadruped step controller entered by the biped's `updateForDoubleSupport` (main's wiring plan): the LIPM height from the desired, the authored centre of mass over the authored soles' support frame, as IHMC holds its nominal height in the support frame (`QuadrupedCenterOfMassHeightManager` l.203-217, l.246-249; main's Q6, standing rule 3); the authored capture point standing (Q-q1); the xGait stream with its 0.5 s first-step delay (Q5); the triggers, the DCM planner and the step adjustment in `doAction`'s order; the biped's back-to-safe rule then `halt` (Q-q2), the end on an empty sequence.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The readings, then standing or stepping, then the assessment; entry and the stepping update are helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-null assertions read the outside time set just before, the first planned step, which the stream always previews, and the soles, present whenever the gait is; the policy gates are the product's inputs, as the biped's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two push-recovery tests, one stream update, one DCM plan over eight steps and one adjustment per substep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; each lift adds one step record to the caller's state.
# src/physics/physicalQuadPlan.ts#physicalQuadPlan

## @evidence contracts/development/common.md#meaningful-documentation

Documents the result and the constant.

## @evidence contracts/development/design.md#principled-representation

The plan's next state, its goals and the assessment, the glitch window in seconds, and the generic quadruped's controller period in seconds, over which its windows keep their time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by advancePhysicalBalance and the settle phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.
# src/physics/physicalQuadPlan.ts#physicalQuadPlan.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents each field.

## @evidence contracts/development/design.md#principled-representation

The next state, the held goals and the assessment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by advancePhysicalBalance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.
