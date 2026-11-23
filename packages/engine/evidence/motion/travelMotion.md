# src/motion/travelMotion.ts#travelMotion

## @evidence contracts/development/implementation.md#principled-implementation

Global-time translation keeps travel continuous across repeated seams; incoming first-segment easing replaces the retained seam easing, and optional facing composes before travel is added.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop owns cycle repetition, root placement and stride-clock carry; the locomotion caller determines speed and cycle count.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsafe or nonpositive cycles and nonfinite velocity or facing components are rejected before baking. Unit-quaternion facing and nonempty valid base clips remain caller admission premises; output growth has no arbitrary choreography cap.

## @evidence contracts/development/common.md#meaningful-documentation

States motion-frame metres/second, cycle admission, facing composition, seam behavior and fallback identity ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cycles and K base keyframes, O(CK) time and output storage are required to bake every repeated keyframe; there is no continuous physics integration.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Base articulation and authored root values remain borrowed, while fallback identity values are fresh per output root; gait metadata is carried once rather than recalculated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the output clip and its roots; no shared mutable fallback identity escapes and no ongoing simulation task or cache is retained.
