# src/film/intersectsPerspectiveFrustumSegment.ts#intersectsPerspectiveFrustumSegment

## @evidence contracts/development/implementation.md#principled-implementation

The segment's ends are brought into the camera frame by the inverse rotation about the lens, then clipped by Cyrus-Beck against the six planes in `localSegmentMeetsPerspectiveFrustum`; finite endpoints, a valid lens, nearly unit camera rotation and representable intermediates are premises. Binary64 boundary rounding remains and this is not a rendered-pixel proof.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The world-to-camera transform and the crop conversion are the only steps here; the clipping core and the crop conversion are shared with the box test and the projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point of the segment is sampled and no tolerance widens a plane; the same algebraic six-plane criterion applies to every segment, subject to the stated floating arithmetic premises.

## @evidence contracts/development/common.md#meaningful-documentation

States why clipping replaces point tests, with the close-shot band that motivates it, that boundary contact counts, the crop error, and each parameter's frame and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one quaternion inverse, two rotations, one crop conversion and six plane updates.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over one segment and one camera that coordinates no work across calls; the box test reuses the clipping core directly rather than calling this per edge.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The two camera-local endpoints and the NDC crop live only for the call; nothing outlives it.
