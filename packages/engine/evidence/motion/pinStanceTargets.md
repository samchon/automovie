# src/motion/pinStanceTargets.ts#pinStanceTargets

## @evidence contracts/development/implementation.md#principled-implementation

Legacy contiguous true samples define stance runs. Timed contacts follow the same height threshold and recheck an active target at every exact support boundary. Every resulting target must be finite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The detection/pinning stage owns run grouping and target choice, leaving clinical IK and dense keyframe output to rekeyPlantedFeet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing timed support is contact absence. Opening pins apply to actual opening stance. Malformed sampled or carried target coordinates throw.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive times, model-frame coordinates, parallel-array premise, ground snapping, exact scope changes, and opening-target precedence.

## @evidence contracts/development/implementation.md#efficient-algorithms

For L legs and F frames, mask construction, run grouping and target assignment take O(LF) work with O(F plus contacts) maps/entries and O(number of runs) compact metadata.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Frames in a run share one fixed target. A timed run resamples that target only when the active scope may change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned per-frame maps and plants belong to the pass caller; run masks/ranges are temporary, and no input pose, callback or external handle is retained.
