# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IInterval

## @evidence contracts/development/common.md#meaningful-documentation

Defines sampled step, group and member order.

## @evidence contracts/development/design.md#principled-representation

The cache clock identifies the same interval for both fitted participants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One step and one group tag the report and its failures.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Membership is explicit at the sampled step.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IWitness

## @evidence contracts/development/common.md#meaningful-documentation

States body ownership, relationship identity and component units.

## @evidence contracts/development/design.md#principled-representation

A body-scoped relation id disambiguates equal local ids in the same group.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains components for comparison against independent geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A satisfied separation reports zero violation.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IReport

## @evidence contracts/development/common.md#meaningful-documentation

Names attempted updates, metre tolerance and residual norm.

## @evidence contracts/development/design.md#principled-representation

The tolerances apply to geometric motor goals for the interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains the aggregate and named signed witnesses together.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These values carry no native impulse or interpolated contact promise.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IConverged

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the converged arm of the result type.

## @evidence contracts/development/design.md#principled-representation

Uses the same witness schema as an unconverged fit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A live completed simulation exposes this report at its authored step.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contains report data only.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IUnconverged

## @evidence contracts/development/common.md#meaningful-documentation

Explains how a numerical stop appears in the status.

## @evidence contracts/development/design.md#principled-representation

Distinguishes exhaustion and a stalled descent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the final observed residual and the stop reason.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The failed candidate remains internal to the incident.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IRefused

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable refusal categories and their human-readable detail.

## @evidence contracts/development/design.md#principled-representation

The reason distinguishes authored, graph, resource and geometry failures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same refusal fits admission and the late geometry stage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A refusal provides evidence of its condition without emitting goal poses.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.IFailure

## @evidence contracts/development/common.md#meaningful-documentation

Defines the complete set of public failure outcomes.

## @evidence contracts/development/design.md#principled-representation

A union distinguishes a rejected request from an attempted solve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Engine's typed error carries this result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither variant exposes goals.

# src/physics/IAutoMoviePhysicalCoupledTargetFit.ts#IAutoMoviePhysicalCoupledTargetFit.ISeries

## @evidence contracts/development/common.md#meaningful-documentation

States both lookup keys and completed-run scope.

## @evidence contracts/development/design.md#principled-representation

Sparse ordinal keys preserve the sampled clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Clients can read one result directly in any order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reports describe targets and remain separate from pose archives.
