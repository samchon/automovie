# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace

## @evidence contracts/development/common.md#meaningful-documentation

States what the trace records, its units and that it never feeds back into the controller.

## @evidence contracts/development/design.md#principled-representation

A union discriminated by kind, one member per event or reading, so a test narrows on the kind it asserts on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each kind is recorded by one phase: the plan's trigger, withdraw, switch and assessment, the lift's lift, the touchdown's landing and failure, the handoff's cancellation, the swing's swing and the root demand's stance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No any or index signatures; every field is typed.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

Names a horizontal point and its units.

## @evidence contracts/development/design.md#principled-representation

The x and z a horizontal reading keeps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the trigger, assessment and stance records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two numbers, nothing else.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.ITrigger

## @evidence contracts/development/common.md#meaningful-documentation

Documents each field of a step's trigger.

## @evidence contracts/development/design.md#principled-representation

The capture point, the step and why it was asked for, as the plan decides it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalancePlan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional fields are absent when the assessment has no value for them.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.IWithdraw

## @evidence contracts/development/common.md#meaningful-documentation

Documents a withdrawn request.

## @evidence contracts/development/design.md#principled-representation

The limb whose request was withdrawn and when.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalancePlan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.ISwitch

## @evidence contracts/development/common.md#meaningful-documentation

Documents a request moved to another limb.

## @evidence contracts/development/design.md#principled-representation

The limbs it leaves and moves to, and the new pair's partner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalancePlan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The partner is absent for a single step.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.ILift

## @evidence contracts/development/common.md#meaningful-documentation

Documents a lift and the seat's load and bearing at release.

## @evidence contracts/development/design.md#principled-representation

The two readings the release decision was made on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalanceLift.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.ILanded

## @evidence contracts/development/common.md#meaningful-documentation

Documents a landing, whether it was early and where.

## @evidence contracts/development/design.md#principled-representation

The landed endpoint in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalanceTouchdown.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.IEnded

## @evidence contracts/development/common.md#meaningful-documentation

Documents steps ended without a landing and the two causes.

## @evidence contracts/development/design.md#principled-representation

One shape for both endings, told apart by kind, with the limbs whose steps ended.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalanceTouchdown and physicalBalanceHandoff.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.IAssess

## @evidence contracts/development/common.md#meaningful-documentation

Documents each reading of the plan's assessment.

## @evidence contracts/development/design.md#principled-representation

The capture point, its excursions, the decision's inputs and the chosen step, as the plan read them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalancePlan each substep a trace is passed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional fields are absent when the assessment has no value for them.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.ISwing

## @evidence contracts/development/common.md#meaningful-documentation

Documents each reading of a swing substep.

## @evidence contracts/development/design.md#principled-representation

The path's progress, clearance, goal and feed-forward, with the endpoint's actual place and velocity beside them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalBalanceSwing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/IAutoMoviePhysicalBalanceTrace.ts#IAutoMoviePhysicalBalanceTrace.IRoot

## @evidence contracts/development/common.md#meaningful-documentation

Documents each reading of the stance's demand.

## @evidence contracts/development/design.md#principled-representation

The pendulum's state, the commanded centre of pressure and the wrench asked of the supports.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recorded by physicalRootDemand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.
