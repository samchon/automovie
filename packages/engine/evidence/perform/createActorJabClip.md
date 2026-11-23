# src/perform/createActorJabClip.ts#createActorJabClip

## @evidence contracts/development/implementation.md#principled-implementation

Three keyframes use easeIn before the strike and easeOut after it, preserving the reference synthesizer's declared snap-and-retract timing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the static jab envelope; target resolution and reachPose solve happen in the calling gesture branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 40% peak is a choreography policy with no collision solve or hidden ROM clamp; downstream gates decide whether the authored result is acceptable.

## @evidence contracts/development/common.md#meaningful-documentation

States positive seconds, 40% peak, borrowed strike pose and invocation-local shared rest endpoints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant construction of three keyframes and one empty rest pose; no skeleton or target resampling occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both rest endpoints share the invocation's rest pose, while the solved strike pose is reused at its peak without another IK call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the result and must preserve borrowed pose data during playback; no process, task or persistent cache is acquired.
