# src/validation/validateTransformScalars.ts#validateTransformScalars

## @evidence contracts/development/implementation.md#principled-implementation

Checks finite vector components and positive scale, and delegates quaternion unit length to ViolationCollector.unitQuaternion's hypot norm and shared 1e-6 tolerance; the scale rule excludes collapsed or reflected transforms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transform gate serves engine model, pose, affordance and architecture validation as well as production artifact ingress; vector admission and quaternion policy reuse existing validation owners instead of a second artifact-specific scalar implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reports every independent out-of-domain TRS field without repairing, normalizing or replacing it; no caller, model or axis gets a special tolerance, and quaternion norm is evaluated only after finite numeric components are admitted.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unchecked input, finite component and positive scale domains, unit quaternion tolerance, independent nested-field error paths and the absence of normalization.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed three-vector/quaternion record takes constant time and temporary space, including ten component reads, one quaternion norm and three positivity comparisons; no scene-wide scan or geometry rebuild occurs here.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads one current mutable transform and appends its findings; it coordinates no phases and retains no verdict that could outlive an authored edit.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Owns no long-lived state; only the caller's collector keeps bounded field findings after return, while the temporary quaternion copy is released when its norm check finishes.
