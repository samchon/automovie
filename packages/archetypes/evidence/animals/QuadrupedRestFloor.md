# src/animals/QuadrupedRestFloor.ts#QuadrupedRestFloor

## @evidence contracts/development/common.md#meaningful-documentation

States the rigid primitive domain, floor-height meaning, plane exclusion and refusal behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Engine physicalShapeBounds supplies exact sphere, box and capsule extrema. The missing cylinder/cone primitives use their support function in world -Y: a cylinder's radial projection is r times the horizontal length of its unit axis, and a cone selects the lowest of its base rim and apex.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit positive primitive dimensions and a rigid transform, delegate engine-supported exact bounds, and handle only the two primitive forms the physical shape union cannot express without approximation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No padded floor tolerance, species case, inner cylinder capsule or mesh-bound guess hides penetration; unsupported geometry is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and storage per primitive, with at most three rotated axes for a box.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing engine's exact physical-shape bound owner for its supported solids; each current transform is measured afresh because different poses cannot reuse a completed bound.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses call-local scalar/vector records and retains no model, buffers, cache or external resources.
