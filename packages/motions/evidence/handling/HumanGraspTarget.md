# src/handling/HumanGraspTarget.ts#HumanGraspTarget

## @evidence contracts/development/common.md#meaningful-documentation

States the prop and handle scope, the world-frame input, the three outputs and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The affordance frame composed with the prop's places the grip point, the approach along its -Y and the wrapped axis along its +X (`AutoMovieAffordanceKind`); the width is the authored aperture or else the span along the approach of the collider whose centre lies nearest the grip point (`physicalShapeSpan`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One handle lookup, one point transform, the frame on it and the complete target on the frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing handle or collider list is refused; the frame reader never fabricates a collider list.

## @evidence contracts/development/implementation.md#efficient-algorithms

The handle is found and its width read once (S - 1 centre comparisons and one span without an authored aperture); each frame read is O(1); a complete target wraps S colliders.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The handle, the shapes and the width are read once for the plan, the width being a distance in the rigid prop's own frame that no placement changes; each frame computes its own point, approach and axis.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The readers hold the affordance and the shape list until the plan is released.
