# src/motion/contactMask.ts#contactMask

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same inclusive height predicate for planting runs and per-frame retarget contacts; the ground callback and tolerance use the resolved pose's model-metre frame, so all consumers classify the same contact geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mask primitive owns contact classification; pinStanceTargets groups runs and preserveRetargetContacts maps each contacting source frame separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid tolerance or sampled nonfinite height refuses instead of silently yielding all-false contact; an unresolved effector remains explicitly non-contacting rather than guessed from another bone.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive height threshold, model frame, missing-effector meaning and callback failure effects. Each map need retain only actual FK worldPosition; existing complete frames remain accepted without an admission or finite-point certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map lookup and at most one ground sample per frame yields O(F) work and an F-boolean result; no FK or repeated bone scan occurs in this primitive.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumes already completed FK positions supplied by the caller, either in full frames or position-only views. No rotation is read or manufactured. Ground callbacks are evaluated at actual effector positions and are not memoized across possibly effectful samples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one owned boolean per input frame and retains neither callback nor maps; callback/terrain resources remain caller-owned.
