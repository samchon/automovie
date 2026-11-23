# src/render/IAutoMoviePlanPoseKeypointSidecarProps.ts#IAutoMoviePlanPoseKeypointSidecarProps

## @evidence contracts/development/design.md#principled-representation

Aspect defaults to 16/9 in resolvePoseKeypoints; this declaration performs no numerical admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planPoseKeypointSidecar exchanges sequence, shots, scenes, motions, skeletons, fps, aspect, crop; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Aspect defaults to 16/9 in resolvePoseKeypoints; this declaration performs no numerical admission.

## @evidence contracts/development/common.md#meaningful-documentation

Sequence clock and resolvable scene/motion/skeleton inputs for projected joint records. planPoseKeypointSidecar preserves one row per output frame, skips unresolved actors, and uses full-frame projection unless crop is supplied. The prose and members document how planPoseKeypointSidecar interprets and admits these values.
