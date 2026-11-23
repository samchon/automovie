# src/animals/QuadrupedTail.ts#QuadrupedTail

## @evidence contracts/development/common.md#meaningful-documentation

States the anatomy, the least turn, the plane it turns in and its limit.

## @evidence contracts/development/design.md#principled-representation

The tail's own bar, the footing beneath its end and one rotation about its joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `rideQuadruped` on routes whose techniques meet steep faces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tail is turned, never shortened or let through the ground; a turn beyond `ROM` is not taken, and the footing's own check then refuses the pose.

# src/animals/QuadrupedTail.ts#QuadrupedTail.carry

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and when the model is returned unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

The far end's signed distance to the footing beneath it is a sinusoid of the turn about the lateral axis through the dock; its zero nearest the posed carriage is the least turn, applied as a parent-local rotation of the tail bone and emitted through the same rig.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure, solve one sinusoid, re-emit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn is bounded by `ROM`; nothing is moved when the tail clears.

## @evidence contracts/development/implementation.md#efficient-algorithms

One landing query per sample; the read and emit run only when the tail would enter the footing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `QuadrupedWorldPose`'s read and emit, prepared once per animal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps one prepared pose per animal while it lives.
