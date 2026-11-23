# src/kinematics/resolveLookAt.ts#resolveLookAt

## @evidence contracts/development/implementation.md#principled-implementation

A linear map from unit channel weights onto VRM's per-direction range-map outputs, written on the clinical flexion and twist axes that the head's gaze uses, then added to authored eye angles; per-axis addition is exact for the single-axis turns and is the joint's own Euler composition when both axes move.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The expansion table is shared with the viewer through `GAZE_PRESET_CHANNELS`, and pose resolution stays with `resolvePose`, so this function only converts channels into joint angles and hands the remainder of the expression on.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angles are neither clamped nor checked here: validateModel admits the ranges against the eye bones' range of motion, and a pose that adds more is left for the ROM gate or the player's clamp to report or hold.

## @evidence contracts/development/common.md#meaningful-documentation

States the weight rules and their source, both eyes' formulas and signs, composition with authored angles, how the channels leave the expression, every identity return and what the result shares.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pose's joints and the expression's blendshapes: one pass to read the eight channel weights, one to strip them, and one to rewrite at most two joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure per-sample conversion that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned sample is owned by the caller and borrows the unchanged parts of the input.
