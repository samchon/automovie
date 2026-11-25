# src/posture/HumanDigitReach.ts#HumanDigitReach.depthAt

## @evidence contracts/development/common.md#meaningful-documentation

States the reduction and the early stop.

## @evidence contracts/development/implementation.md#principled-implementation

The deepest phalanx segment's penetration of the body's colliders near the hand: the chain radius less the segment's exact distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One near-collider read, then every digit's segments against every collider.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment of every digit is read until one passes the threshold.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in digits, segments and near colliders; stops at the first past the threshold.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's posed bones and placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanDigitReach.ts#HumanDigitReach.nearBody

## @evidence contracts/development/common.md#meaningful-documentation

States which colliders are near.

## @evidence contracts/development/implementation.md#principled-implementation

A collider whose bounding sphere lies within a hand's length of the hand can touch a digit; the hand's own and its forearm's cannot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter by bone, one by sphere.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the hand's own segments are left out.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the placed shapes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's posed bones and placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanDigitReach.ts#HumanDigitReach.phalanges

## @evidence contracts/development/common.md#meaningful-documentation

States the points and their frame.

## @evidence contracts/development/implementation.md#principled-implementation

Each joint's world origin, then the tip carried by the last phalanx's frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map and one tip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tip is the chain's own offset, never estimated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the chain's bones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's posed bones and placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanDigitReach.ts#HumanDigitReach.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the goal carried and the normal.

## @evidence contracts/development/implementation.md#principled-implementation

A goal on a bone is in the bone's frame; its posed frame carries it into the world.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One demanded FK read and one carry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the goal's bone is resolved, its whole ancestry admitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded FK.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's posed bones and placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanDigitReach.ts#HumanDigitReach.ICarried

## @evidence contracts/development/common.md#meaningful-documentation

States the carried point and normal.

## @evidence contracts/development/design.md#principled-representation

A world point and an optional world normal, as a digit goal has them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The normal is absent when the goal has none.
