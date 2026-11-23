# src/motion/motionToClip.ts#motionToClip

## @evidence contracts/development/implementation.md#principled-implementation

Lowers skeleton nodes with unit scale, samples motion on the shared endpoint-inclusive clock, composes each articulated bone's rest rotation with clinical quaternion, and emits linear/slerp tracks plus rigid root channels when authored roots exist. Unchanged unreachable/stray-joint behavior remains admitted rig/motion semantics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bridge owns sampled track packaging and actor node-prefix identity; sampleMotion owns clinical interpolation and lowerSkeletonNodes owns the matching rig graph.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid rate/duration/empty keyframes and articulated absent bones throw; no unsupported expression track is invented. Dense bake accuracy is exact at samples and may differ between them, especially at easing/step discontinuities.

## @evidence contracts/development/common.md#meaningful-documentation

States sample rate, node prefixes, complete local rotation, no-scale FK matching, omitted expressions and between-sample limitation without a universal O(step squared) claim across discontinuities.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F baked times, A articulated bones and J sampled joints, builds one first-occurrence joint map per sample then performs O(FA) track lookups, with O(FJ) temporary map storage plus output buffers; graph lowering is O(bones) and motion interpolation owns its segment/joint cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One sampleMotion pose and joint lookup map per bake time serve all bone tracks; root translation/rotation share the sampled poses, and track time arrays are independent outputs rather than a retained cross-clip cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns nodes, per-track time/value buffers and clip; sampled pose arrays are released after packaging, output grows with rate*duration and articulated bones, and no renderer/native handle is acquired.
