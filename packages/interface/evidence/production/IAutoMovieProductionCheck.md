# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck

## @evidence contracts/development/common.md#meaningful-documentation

Documents the production subject, its stable check IDs and the scope required at a handoff.

## @evidence contracts/development/design.md#principled-representation

Each independently selectable subject owns its criteria and declared stage membership so a missing check still has an authority that names it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The production keeps checks and required IDs together without storing any observed verdict on its target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Disabling a definition does not change independently chosen stage membership.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

States the measured unit, inclusive bounds, evaluation ownership and declared source files, including named shared files in the owning Git checkout.

## @evidence contracts/development/design.md#principled-representation

A finite quantity from the named inputs is compared against a declared range and remains usable without a camera or film.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One callback and its limits describe the local measurement. Runtime records its observation separately.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback reports the observed quantity so the verifier can apply the authored bounds.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IMeasurement.measure

## @evidence contracts/development/common.md#meaningful-documentation

States the production-root argument, finite observed quantity and read-only contract.

## @evidence contracts/development/implementation.md#principled-implementation

The provider observes its declared inputs while the shared verifier owns comparisons against unit-bearing limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit callback returns the observation to the checker that established its selection scope.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The contract returns a quantity whose value can be checked for finiteness before applying the authored criterion.

## @evidence contracts/development/implementation.md#efficient-algorithms

The callback runs once for its explicitly selected measurement, and its owner decides the observation cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The signature declares a callback and stage receipt reuse belongs to the verifier.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The signature holds no resource. The production-owned measurement manages its own input reads.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.ICapture

## @evidence contracts/development/common.md#meaningful-documentation

States the capture record, subject, diagnostic, view and pass identities and the exact sample or interval. A nested production establishes input identity by explicitly refreshing the capture with its named inputs.

## @evidence contracts/development/design.md#principled-representation

A selected still or consecutive output interval identifies the observed population and binds it to the existing diagnostic owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the capture command and persisted record with a small, explicit scope address.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A still and a multi-frame interval carry separate representations, and the chosen view and pass remain part of the requirement.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IDelivery

## @evidence contracts/development/common.md#meaningful-documentation

States the owning report, render subject, exact movie association and required controls.

## @evidence contracts/development/design.md#principled-representation

A render report exists at the publication boundary so a check points there and requires any guide channels the adopted handoff needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Names the receiving report owner without duplicating the file and control metadata it writes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The selected report must match actual film bytes for a current result.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReview

## @evidence contracts/development/common.md#meaningful-documentation

States the explicit observation, expected medium, subject, file and frame interval.

## @evidence contracts/development/design.md#principled-representation

A named decision applies to the current bytes and observed frames for the specified activity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuse the existing observation record and provide only the scope and identity the production requested.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The authored criterion does not declare its own approval.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.Check

## @evidence contracts/development/common.md#meaningful-documentation

Names the supported computation and observation variants.

## @evidence contracts/development/design.md#principled-representation

One discriminant assigns correctness to the owner of each evidence kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared display metadata accompanies only the fields needed by the selected kind.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

There is no catch-all Boolean kind.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States each result's identity, scope, evidence, actionable status and gate membership.

## @evidence contracts/development/design.md#principled-representation

A closed set distinguishes absence, changed inputs, disabled work, failed observations and actual review need.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One row serves the console and structured consumers without another persisted verdict.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unresolved result stays distinguishable from success even outside a requested gate.

# src/production/IAutoMovieProductionCheck.ts#IAutoMovieProductionCheck.IReport

## @evidence contracts/development/common.md#meaningful-documentation

States selected subjects, requested scope, rows and gate exit semantics.

## @evidence contracts/development/design.md#principled-representation

Stage verdicts follow the report's visible outcomes including required omissions, and an ordinary read has no gate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The command prints or serializes this completed result for the same selection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Filtering runs leaves required omissions in the report.
