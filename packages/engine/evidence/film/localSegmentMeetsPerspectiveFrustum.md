# src/film/localSegmentMeetsPerspectiveFrustum.ts#localSegmentMeetsPerspectiveFrustum

## @evidence contracts/development/implementation.md#principled-implementation

Cyrus-Beck clipping of the segment parameter `[0, 1]` against six half-spaces `f(p) <= 0`, each linear in camera-local coordinates because the viewing depth is `-p.z`, giving algebraic crossings rather than chosen samples; a segment parallel to a plane is decided by the sign at its start, and convexity makes the surviving interval the exact-real intersection. Finite endpoints, positive ordered clip distances and valid lens/crop scalars with representable intermediates are caller premises; binary64 boundary rounding remains.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The clipping core shared by the world-space segment test and the box test, so the box no longer re-transforms each corner and re-validates the crop for every one of its twelve edges.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment is clipped against the same six planes with no tolerance or sampled point; boundary contact counts as inside by the stated rule.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and axis convention of the inputs, how the frustum is bounded, the meaning and units of each parameter, and that touching a face counts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and space: six plane evaluations at each end and one interval update per plane, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over one segment; the reuse of transformed corners across segments is the caller's, which is why the inputs are camera-local.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains and allocates nothing beyond a few scalars for the call.
