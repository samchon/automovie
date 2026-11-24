# src/handling/HumanGraspUsePreparation.ts#HumanGraspUsePreparation.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The context, prop, handle, hand, use, candidate wrist and optional clearance, in the units `IAutoMovieMotionHumanGraspUse` states.

## @evidence contracts/development/design.md#principled-representation

The interface's own props type, named here for the setup's signature.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias of the owned type, no copy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing widened or cast.

# src/handling/HumanGraspUsePreparation.ts#HumanGraspUsePreparation.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

World points and rotations and the wrist-local socket in canonical types; optional `at` and `site` separate a region use from one ahead of the body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member feeds the worn branch or the key builder of `presented`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fixed pose or sampled frame.

# src/handling/HumanGraspUsePreparation.ts#HumanGraspUsePreparation

## @evidence contracts/development/common.md#meaningful-documentation

States the request, the setup and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The tool's line runs from the handle to the working point in the prop's frame at closure; the asked line is forward of the body risen by the use's angle, across toward the other hand, or into the region's surface; the shortest turn between them about their cross product, or about the body's left when they oppose, lays the candidate hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Contacts, lines, region, turn and the two socket places, in that order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing contact or region is refused, never substituted; the 1e-9 cross-product length is the floating-point floor below which the lines are parallel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two affordance scans and one entry FK of the arm and the region's bone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The asked axis is prepared once for every roll of the search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The setup lives for one `presented` call.
