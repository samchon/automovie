# src/internal.ts#HumanObstacleMotion.footprint

## @evidence contracts/development/common.md#meaningful-documentation

States both cases.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid placement on the floor plan: the own frame's x is the left of a body facing its heading, `(cos h, -sin h)`, and its z ahead, `(sin h, cos h)`, heading 0 facing +Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch and one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A still obstacle returns its own footprint.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/internal.ts#HumanObstacleMotion.at

## @evidence contracts/development/common.md#meaningful-documentation

States both cases.

## @evidence contracts/development/implementation.md#principled-implementation

The placed footprint, every other field kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spread.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/internal.ts#HumanObstacleMotion.prop

## @evidence contracts/development/common.md#meaningful-documentation

States what each part is read from and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The shadow of convex colliders is the hull of their corners, outlined by `HumanObstacle.object` at the prop's own origin; the heading is the rotated +Z's direction on the floor plan.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses `object` on the prop at its own origin, then adds the motion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No box is assumed: a prop without colliders is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

As `object`, once per prop.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The footprint is computed once; the motion is the prop's own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the prop's motion for as long as the obstacle is held.
