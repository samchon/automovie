# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment

## @evidence contracts/development/common.md#meaningful-documentation

States the adjustment law, its gates, the zero target, the rate limit from zero at each step, the projection and the flag's last-test rule.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `QuadrupedStepAdjustmentController.computeStepAdjustment` (l.103-176) with its defaults (l.36, l.43-47). A leg without a target first updates its limiter from not a number and zeroes it (l.129-133); the gate is the threshold or an earlier adjustment (l.137); `DeadbandTools.applyDeadband` gates on the error's length and the target uses the raw error (l.139-150, DeadbandTools l.39-53); the limiter is `RateLimitedYoFrameVector.update` (l.102-119) with Euclid 0.11.0's `clipToMaxLength` (Vector3DBasics l.113-128, epsilon l.39). The adjusted goal goes through the crossover projection (l.165-170).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the swinging steps in the reference's order; the limiter and frame changes are helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The flag keeps the reference's last-test semantics rather than any-step semantics; every constant is the reference's default, cited.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the swinging steps, at most four.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the four legs' state.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment

## @evidence contracts/development/common.md#meaningful-documentation

Documents the legs' state, the result, the parameters and the entries.

## @evidence contracts/development/design.md#principled-representation

The reference's per-leg target and limiter with its parameters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the integrator's quadruped phase reads the adjusted goals and the flag, which gates the feet's adjustment (QuadrupedStepController l.90-94).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The parameters are partial only as overrides of the defaults.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Documents the target, the applied adjustment and the limiter's flag with units.

## @evidence contracts/development/design.md#principled-representation

`instantaneousStepAdjustment`, `limitedInstantaneousStepAdjustment` and its `hasBeenCalled`; a missing target is not a number, as the reference marks it, which the limiter's update reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept per leg in the state; the reference's logged multiplier is not kept, as nothing reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.IState

## @evidence contracts/development/common.md#meaningful-documentation

Names the per-leg record.

## @evidence contracts/development/design.md#principled-representation

The reference's quadrant-dependent lists as one record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `initial`, advanced by the update and cleared by `completed`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the state, the steps and the flag.

## @evidence contracts/development/design.md#principled-representation

`adjustedActiveSteps` and `stepHasBeenAdjusted` with the state after the update.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the integrator's quadruped phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.IParameters

## @evidence contracts/development/common.md#meaningful-documentation

Documents each parameter with its unit and source line.

## @evidence contracts/development/design.md#principled-representation

The controller's five parameters and switch and the projection's two.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the update and the projection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.initial

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed state.

## @evidence contracts/development/implementation.md#principled-implementation

The constructor (l.67-85) and the limiter's `reset` there (RateLimitedYoFrameVector l.75-78).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record of four legs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.completed

## @evidence contracts/development/common.md#meaningful-documentation

States which leg is cleared and when.

## @evidence contracts/development/implementation.md#principled-implementation

`completedStep` (l.96-101), called at touchdown; the limiter's flag is kept, as the reference keeps it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy with the leg cleared.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStepAdjustment.ts#physicalQuadrupedStepAdjustment.project

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the clamps and the kept height.

## @evidence contracts/development/implementation.md#principled-implementation

`QuadrupedStepCrossoverProjection.project` (l.37-61) with its defaults (l.26-27): in the body's z-up frame, the stride from the current sole across the body is clamped along the body to the maximum stride, and across it to the maximum and then to the clearance toward the leg's side, in the reference's order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Into the body frame, four clamps, back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
