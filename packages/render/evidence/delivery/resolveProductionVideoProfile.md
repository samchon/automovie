# src/delivery/index.ts#resolveProductionVideoProfile

## @evidence contracts/development/implementation.md#principled-implementation

The fixed fields are the ISO base media unity matrix and the ITU-T H.273 sRGB code points, read from `AUTOMOVIE_MP4_UNITY_MATRIX` and `AUTOMOVIE_MP4_SRGB_COLOUR`, the same constants the normalizer writes and the splice check reads, so the profile cannot name a matrix or color the writer does not emit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function only assembles the profile; validation of raster and rate stays with the callers that own the authored values, and the comparison against a probed file stays in `assertProductionVideoProfile`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No deliverable or caller is special-cased: every video deliverable gets the same fixed fields, which are standard identities rather than measured or fixture values.

## @evidence contracts/development/common.md#meaningful-documentation

The doc gives the units of the varying fields, says they are not validated here, lists every fixed field, and states which returned part is a copy and which is shared.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call does constant work, copying a nine-entry matrix into one new profile and sharing the constant color record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one small profile and coordinates no phases or requests whose work could be shared; the shared parts are already module constants.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the copied nine-entry matrix and the profile object are allocated, both owned by the caller from return; the shared color constant lives for the module's lifetime, and no handle or task is opened.
