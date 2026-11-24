# src/reaction/staggerRecovery.ts#staggerRecovery.of

## @evidence contracts/development/common.md#meaningful-documentation

States its input, the admitted push, entry geometry and recovery, and when the recovery is null.

## @evidence contracts/development/implementation.md#principled-implementation

The push is read causally where its source is as the plan begins (`ReactionSource`); the recovery is `staggerRecover.recover`'s over the entry's prepared pendulum geometry, whose legs admit each step in closed form (`staggerAdmission`), so a null recovery is exactly the stagger's own admission refusing the push.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the stagger's admission only, so `stagger.plan` and `perturb` read the same decision; `stagger.recovered` plans from it and `refusal` states its refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No speed, step or region is relaxed; the push and the recovery are the ones `stagger.plan` read before this split, in the same order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One causal target read, one entry geometry preparation and one recovery search of at most 30 closed-form pendulum prefixes; no stance course or quadratic program is solved.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The entry geometry is returned so the limit's bisection and the plan reuse it; nothing is cached between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain values; it retains nothing after return or throw.

# src/reaction/staggerRecovery.ts#staggerRecovery.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs and the refusal it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The feasible range is the fastest push this body catches along the same push, `staggerLimit.of`'s bisection over the same recovery model, so the refusal reports the real limit of the admission that refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One refusal builder beside the admission that decides it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The text, axis and range are the ones `stagger.plan` threw before this split; no step is shortened to avoid the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Runs the limit's bisection only when a push is refused, over the admission's prepared entry geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the admission's push and entry geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a refusal value; it retains nothing.

# src/reaction/staggerRecovery.ts#staggerRecovery.IAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its quantity, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The push is a world floor direction of unit length, the righting is seconds, and the recovery is null exactly when no `STEPS` steps catch the push.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serves `stagger.plan`, `stagger.recovered`, `perturb` and `refusal`; the recovery's and geometry's types are imported from their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The null recovery is the admission's verdict, not a placeholder for a failure.

# src/reaction/staggerRecovery.ts#staggerRecovery.Fixed

## @evidence contracts/development/common.md#meaningful-documentation

Names the prepared entry geometry by its owner.

## @evidence contracts/development/design.md#principled-representation

The return type of `StaggerPendulum.prepare`, whose owner states its units and frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias of the owner's type, read by the admission, the plan and the limit.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias adds no shape of its own.