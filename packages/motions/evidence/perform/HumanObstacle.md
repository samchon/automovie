# src/perform/HumanObstacle.ts#HumanObstacle.wall

## @evidence contracts/development/common.md#meaningful-documentation

States each input with its unit and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A wall's footprint is the rectangle half its thickness either side of its centre line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direction, one normal and four corners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wall of no length, thickness or height is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/perform/HumanObstacle.ts#HumanObstacle.apertures

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, in which axes, and what is left out.

## @evidence contracts/development/implementation.md#principled-implementation

The affordance record gives an aperture's width along `+X` centred on its frame and its height along `+Y` from it, so the placed frame's origin is the sill's middle and its turned `+X`, made level, the direction of the width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No width or height is assumed for an aperture that states none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the affordances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Places the object with `HumanObject.frame`, as its seats and props are placed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/perform/HumanObstacle.ts#HumanObstacle.object

## @evidence contracts/development/common.md#meaningful-documentation

States what each part of the obstacle is read from, how a round collider is outlined and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The floor-plan shadow of a convex solid is the convex hull of its vertices' shadows, and a ball's is a disc; the hull of the corners is Andrew's monotone chain (Andrew 1979, Inf Process Lett 9:216), and a disc's circumscribed regular polygon of n sides stands at most r(sec(pi/n) - 1) outside it. The heights are the engine's exact bounds of each placed collider.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the colliders for their corners and heights, one hull, the openings reused.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No box is assumed round an object: the solid is its own colliders', and an object without them, or whose colliders stand on no area, is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the colliders' corners and the hull n log n in them, once per obstacle.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Places the object with `HumanObject.frame` and reads its openings with `apertures` and its heights with `physicalShapeBounds`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/perform/HumanObstacle.ts#HumanObstacle.blocking

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the meaning of null.

## @evidence contracts/development/implementation.md#principled-implementation

A segment is clipped against a convex footprint edge by edge (Cyrus and Beck 1978); a footprint whose solid lies wholly above the body's height or below the floor is passed under or over. A crossing is through an opening when the segment crosses the opening's line inside its width: it is free when the opening leaves half the body's breadth either side of the crossing and its height is the body's, and otherwise blocked with the measure that falls short.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clip per obstacle, one test per opening, and the nearest block kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stretch that starts inside a footprint is blocked at its start; nothing is rounded in the body's favour.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the obstacles' edges and openings, which a scene has few of.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
