# src/motion/sequenceMotion.ts#sequenceMotion

## @evidence contracts/development/implementation.md#principled-implementation

Shifts each part by the cumulative duration and preserves incoming segment easing at dropped duplicate seams; the stride clock survives only equal period/phase clips spanning whole cycles within 1e-9 cycle tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single traversal owns timeline concatenation and its stride-clock decision; playback and interpolation remain with sampleMotion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-9 whole-cycle comparison is the existing clock-continuity tolerance; incompatible clocks are cleared instead of synthesized, and no skeleton-specific seam correction exists.

## @evidence contracts/development/common.md#meaningful-documentation

States same-skeleton admission, seconds, seam easing, borrowed pose data, loop choice and honest clock loss.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P parts and K total keyframes, validation, concatenation and clock comparison cost O(P+K) time and O(K) output storage; all keyframes must be visited to place their times.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Part pose/expression objects are reused while clock-bearing keyframes are copied; equal gait metadata is carried once rather than rebaked.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the sequence and copied keyframes; input parts and nested pose values are borrowed and no sequence cache or task remains.
