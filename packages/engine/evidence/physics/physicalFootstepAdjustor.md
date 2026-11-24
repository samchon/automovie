# src/physics/physicalFootstepAdjustor.ts#physicalFootstepAdjustor

## @evidence contracts/development/common.md#meaningful-documentation

States when the footstep moves, where to, the frame and the empty region.

## @evidence contracts/development/implementation.md#principled-implementation

A port of IHMC 201903 `FootstepAdjustor.adjustFootstep` (l.68-110), `projectFootstepInCaptureRegion` (l.120-147) and `calculateTouchdownFootPolygon` (l.156-166): the touchdown outline scaled by 0.5 about the footstep, tested against the region; when it misses, the region's centroid pushed 10 m away from the support's centroid and projected onto the region.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The empty case, the overlap test, then the projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or non-null assertions; a support centroid on the region's centroid divides by zero as the reference's normalization does.

## @evidence contracts/development/implementation.md#efficient-algorithms

One convex clip and one projection over the region's edges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It adjusts one footstep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalFootstepAdjustor.ts#physicalFootstepAdjustor

## @evidence contracts/development/common.md#meaningful-documentation

Documents the result and the reference's constants.

## @evidence contracts/development/design.md#principled-representation

The adjusted position and the reference's two constants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the push recovery.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.

# src/physics/physicalFootstepAdjustor.ts#physicalFootstepAdjustor.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the position and the flag.

## @evidence contracts/development/design.md#principled-representation

The footstep's position in the caller's frame and whether it moved, the reference's return value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the push recovery.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members required.
