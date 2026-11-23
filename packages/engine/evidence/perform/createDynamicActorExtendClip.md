# src/perform/createDynamicActorExtendClip.ts#createDynamicActorExtendClip

## @evidence contracts/development/implementation.md#principled-implementation

Adds the exact halfway landmark to the shared 24 Hz bake and applies the same scalar envelope as the static three-frame extension; target geometry is solved by the supplied callback at each time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The extension envelope owns only its half-span law; shared sampling and numeric arm weighting own their respective operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This sampled tracking approximates inter-key motion and does not guarantee continuous contact or ROM validity; callback errors propagate.

## @evidence contracts/development/common.md#meaningful-documentation

States moving-goal sampling, the halfway hold law, positive seconds, null failure and sampled contact limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F samples and per-sample IK cost R, O(F log F + F R) time and O(F J) pose storage through the shared baker, with J solved joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The single halfway landmark is deduplicated with the regular grid, and each callback result is used once for weighting.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns a successful clip; invocation-local partial poses are released on null/throw and no callback or task is retained beyond the clip construction.
