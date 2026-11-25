# src/everyday/prepareKneelFoot.ts#prepareKneelFoot

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed endpoints, stationary pivot, moving arc, metres and returned degree value.

## @evidence contracts/development/implementation.md#principled-implementation

Classifies the foot by `kneelKeys.still`, interpolates the toes linearly, pivots a staying foot rigidly about its toe joint and carries a moving one on its straight way and turn at the caller's eased progress, lifted on the phase's linear share so its sole meets the floor at zero horizontal speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Classifies once, then binds either the pivot or the arc; the result writer adds the bearing state and the toes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The movement test is the one the plant windows use, so a foot bears exactly where its window says; no contact or range bound is relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stationary phases prepare fixed heading/socket geometry once; moving phases prepare both actual pivots plus native fixed-endpoint vector/slerp prerequisites once. Each query retains its original current pitch or arc and fresh placement, without rebuilding those constants.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body and the two authored keys remain fixed, so only progress and interpolated toe flexion vary; no posture fit or evaluated output is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains two keys and, for a moving foot, two rigid placements until its owning kneel plan is released.
