# src/posture/HumanShapeFraming.ts#HumanShapeFraming.IFramed

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The sphere every shape has and the hull's planes, frame and last deciding face, absent for other shapes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, each read by `beyond`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The planes are packed numbers in the hull's own frame, so a test reads no object.

# src/posture/HumanShapeFraming.ts#HumanShapeFraming

## @evidence contracts/development/common.md#meaningful-documentation

States what is computed, and that a sweep computes it once, when it prepares its room.

## @evidence contracts/development/implementation.md#principled-implementation

The sphere and, for a hull, the face planes of the engine's hull, its centre and the rotation into its frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One framing per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The exact sphere, planes, centre and rotation, never approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

The caller frames each shape once, when its sweep prepares its room (`HumanArmOvershootRoom.of`), and every candidate reads the framing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `sphere` and the engine's hull faces.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The framing belongs to the caller's room and is released with it; the face planes are the hull's own, kept with its points.

# src/posture/HumanShapeFraming.ts#HumanShapeFraming.bendPlanes

## @evidence contracts/development/common.md#meaningful-documentation

Defines the original native plane backing and unproved fallback.

## @evidence contracts/development/implementation.md#principled-implementation

Requires the actual cache identity and native typed length before borrowing the array.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ownership test and the descriptor chain of length.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never inspects unknown replacement array objects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work before the consumer reads its exact current plane words.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The room's scorer can compare live planes without reading unvisited exact hulls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanShapeFraming.ts#HumanShapeFraming.beyond

## @evidence contracts/development/common.md#meaningful-documentation

States the measure, why it never exceeds the signed distance and the face order.

## @evidence contracts/development/implementation.md#principled-implementation

A point's distance from the bounding sphere, then the greatest of a hull's face-plane distances, each no more than the signed distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sphere, then the last deciding face, then the rest.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only a point that surely lies beyond the bound is answered yes; the exact distance stays the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

The scan stops at the first face beyond, the last deciding face tried first.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called per point with nothing to reuse but the remembered face.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Remembers only the deciding face on the framed record it is given.

# src/posture/HumanShapeFraming.ts#HumanShapeFraming.sphere

## @evidence contracts/development/common.md#meaningful-documentation

States each shape kind's sphere and why it bounds the signed distance.

## @evidence contracts/development/implementation.md#principled-implementation

The shape's own containing sphere (`HumanColliderBound`), placed by the shape's and the segment's frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local sphere and one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No radius is padded.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per shape, a hull's own sphere aside.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one owner of a placed shape's bounding sphere, read by the framing, the trajectory's shapes, the body's distance screen and the digits' near colliders; the local sphere is HumanColliderBound's and every world placement is recomputed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh world centre and scalar radius escape; no input or computed placement is retained by this function.
