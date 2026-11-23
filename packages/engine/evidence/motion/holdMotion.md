# src/motion/holdMotion.ts#holdMotion

## @evidence contracts/development/implementation.md#principled-implementation

Equal endpoint pose values produce a constant interval under sampleMotion's interpolation; two endpoints establish a positive-duration non-looping clip without resampling or inventing articulation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The helper owns clip identity, duration admission and endpoint packaging; pose validity and skeleton compatibility remain the caller's rig gate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite or nonpositive duration throws rather than emitting coincident keys; no hidden rest pose replaces the supplied articulation.

## @evidence contracts/development/common.md#meaningful-documentation

States seconds, two endpoints, skeleton-id override, absent expression and shallow nested-record sharing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates two frame/pose wrappers and one clip in constant work and storage, independent of joint count because nested pose data are shared.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both endpoints reuse the supplied pose values instead of copying a full rig or running FK; no cache survives across holds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns output wrappers and continues to share nested root/joints with the input; no retained motion history, timer or handle is acquired.
