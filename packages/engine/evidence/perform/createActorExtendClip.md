# src/perform/createActorExtendClip.ts#createActorExtendClip

## @evidence contracts/development/implementation.md#principled-implementation

Three keyframes at zero, half-span and span with easeInOut encode the reference point/reach envelope; callers obtain the supplied pose from reachPose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the static extension envelope while reachPose owns geometry and the caller owns target resolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The half-span policy is fixed choreography, not a measured contact simulation; no ROM clamp is added and downstream validation owns any invalid solved pose.

## @evidence contracts/development/common.md#meaningful-documentation

States seconds, halfway extension, endpoint pose sharing, empty rest articulation and downstream ROM ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant keyframe construction independent of rig size; the caller's IK work is not repeated here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same supplied endpoint pose is shared by the two held frames, and this helper performs no repeated IK or target sampling.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned clip; the borrowed pose must remain unchanged during playback, and there is no retained resource.
