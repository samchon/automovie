# src/gym/createStillRings.ts#createStillRings

## @evidence contracts/development/implementation.md#principled-implementation

Identical convex sections rotated around the ring centres share the visible and physical boundary with an open middle. The hangers and contacts share their own attachment transforms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw dimensions, build the fixed frame, then place the two suspensions from the same ring section.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fore-aft travel is authored. The coarse frame and faceted ring use measured contact geometry, with no collider spanning the open centre.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares one small convex hull and places a fixed number of rigid instances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both rings and all their sections share a prepared cell. The common articulation owner turns each suspension and its grip.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Construction retains no external resources.

## @evidence contracts/development/common.md#meaningful-documentation

Names the floor frame, the separate grips and the swing axes.
