# src/geometry/prepareAutoMovieSurfaceFrame.ts#prepareAutoMovieSurfaceFrame

## @evidence contracts/development/implementation.md#principled-implementation

A centroid and orthonormal edge basis express all three original points as rigid coordinates; normalized edges avoid cross-product magnitude overflow and preserve nonzero small triangles without an absolute size threshold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses Vector3 algebra and the shared normal-priority frame admission, leaving destination placement to placeAutoMovieSurfaceFrame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Point count, finiteness, represented noncollinearity and reference sign are checked; no triangle length is replaced, scaled or snapped, and no surface or actor name selects a branch.

## @evidence contracts/development/common.md#meaningful-documentation

States metres, centroid, ordered heading/normal, optional sign selection, frozen ownership, overflow refusal and conditioning limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Exactly three points require constant arithmetic and storage; source projection is paid once instead of on every destination placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Frozen basis coordinates serve any number of destination frames for the same source triangle; later input edits cannot silently alter them and require new preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one frozen frame and three frozen offsets until released; inputs and per-call vector temporaries are not retained, with no cache or native resource.
