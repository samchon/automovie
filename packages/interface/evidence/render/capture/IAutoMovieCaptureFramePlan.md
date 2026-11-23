# src/render/capture/IAutoMovieCaptureFramePlan.ts#IAutoMovieCaptureFramePlan

## @evidence contracts/development/design.md#principled-representation

Deduplicated ordered sample instants and their event/cut windows. planAutoMovieCaptureFrames rounds grid samples to the nearest frame, preserves explicit off-grid instants, clips windows to available frames, and retains each event window even when it overlaps another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieCaptureFrames exchanges times, windows; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Deduplicated ordered sample instants and their event/cut windows. planAutoMovieCaptureFrames rounds grid samples to the nearest frame, preserves explicit off-grid instants, clips windows to available frames, and retains each event window even when it overlaps another.

## @evidence contracts/development/common.md#meaningful-documentation

Deduplicated ordered sample instants and their event/cut windows. planAutoMovieCaptureFrames rounds grid samples to the nearest frame, preserves explicit off-grid instants, clips windows to available frames, and retains each event window even when it overlaps another. The prose and members document how planAutoMovieCaptureFrames interprets and admits these values.
