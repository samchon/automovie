# src/film/plantPerformShotStanceFeet.ts#plantPerformShotStanceFeet

## @evidence contracts/development/implementation.md#principled-implementation

Ground contact is solved in the actor's model frame by `plantStanceFeet`, and positions cross between frames by the inverse and forward rigid transform of the staged node, which is exact for the unit-scale yaw-only transform staging emits; ground height is sampled in world space and carried into the model frame point by point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns frame conversion and the performance findings. `prepareStageSupport` owns scoped selection and `plantStanceFeet` owns the solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A scoped lookup does not fall back to scene-wide ground. The root path is observed without rewriting authored root height. Rigs without recognized feet keep their authored motion.

## @evidence contracts/development/common.md#meaningful-documentation

States which actors are sampled and planted, frame conversions, scope timing and suspension, validation findings, motion mutation and result order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorts A motion and support ids in O(A log A). Each qualifying actor reads its node and runs one stance solve or a root-only sample scan. Scoped queries pay the selected footprint and height costs only.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the per-stage support preparation or the ordinary scene ground. Rig, axes and frame reads occur before the shared FK/IK solve. Root samples use the same motion clock and poses as planting, and prior plants are indexed once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prior-plant index ends at return. Each actor's immutable rig snapshot and child-owned FK rows end after its synchronous planting call, with weak provenance retaining neither strongly. Only numeric planted clips/points enter caller motions and returned entries; no operation reader, rig workspace, callback history, task or handle escapes.
