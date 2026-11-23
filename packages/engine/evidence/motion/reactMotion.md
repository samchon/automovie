# src/motion/reactMotion.ts#reactMotion

## @evidence contracts/development/implementation.md#principled-implementation

Uses impactRecoil's chain-propagated, ROM-clamped pose at peak and explicit neutral clinical joints at both endpoints; peak must lie strictly inside duration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The action helper owns reaction timing and keyframe easing, while impactRecoil owns impulse-to-joint propagation and rig limits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid duration or peak throws; the short-clip peak fraction preserves valid quick reactions without injecting zero articulation into neutral endpoints.

## @evidence contracts/development/common.md#meaningful-documentation

States three-stop timing, default peak policy, rig clamping and null-neutral semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates three keyframes and O(chain length) neutral joints plus the delegated recoil calculation; no dense frame bake or repeated IK is needed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both rest endpoints reuse one neutral pose; the recoil pose is computed once for the peak and no result is cached across changing rig or push inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned keyframes own their wrappers and share the neutral pose at both ends; call-local recoil state is released and no simulation handle or ongoing task exists.
