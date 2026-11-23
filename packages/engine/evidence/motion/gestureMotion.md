# src/motion/gestureMotion.ts#gestureMotion

## @evidence contracts/development/implementation.md#principled-implementation

Scales fixed gesture stop fractions by duration and emits easeInOut segments; jump additionally carries authored root-height stops. Preset clinical angles are authored motion content, not measurements or target-dependent IK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Generic shape data and jump stops live with this synthesizer; target-dependent strike stays at the reach-based action owner because this API has no target or rig geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Gesture names select explicit supported content; unsupported kinds return null rather than a substitute gesture. New output joint arrays/records isolate callers from the private preset tables.

## @evidence contracts/development/common.md#meaningful-documentation

States supported/unsupported scope, clinical/default-ROM meaning, caller-owned duration admission and the independent output records.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work and output scale with the selected shape's authored stops and joints; supported presets have fixed small populations and require no IK, render or time sweep.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Private shape tables are reused as read-only authored content, but every emitted joint record is copied so mutating one clip cannot rewrite later calls' presets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Module preset tables have a fixed population; callers own generated keyframes/poses/joints and no output retains a mutable preset joint or acquires a resource handle.
