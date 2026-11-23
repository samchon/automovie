# src/physics/trackPhysicalContactTargets.ts#trackPhysicalContactTargets

## @evidence contracts/development/common.md#meaningful-documentation

Gives the per-interval replan condition, the simultaneous scene, the coupled delegation and the role of `peers`.

## @evidence contracts/development/implementation.md#principled-implementation

Replans only when the body's stored plan has another step or revision. A coupled target delegates to the group fit; any other target fits alone from the shared seed against the same scene.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One replan branch chooses the group or individual fit, then the stored plan is sampled. Seed selection, fitting, support goals and interval planning stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No `any` or type assertion. Non-null assertions read admitted defaults (`substeps`, `contactTolerance`), geometry prepared for every relationship target, and the plan written in the branch above. A coupled target without `peers` throws instead of reading empty peers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work outside the fit; one fit per body interval and revision, or one group fit for all members.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stored interval plan across substeps until its step or revision changes. Group members reuse the plans their group fit wrote.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps one serializable plan per body on the run binding, replaced each interval and captured by controller checkpoints.
