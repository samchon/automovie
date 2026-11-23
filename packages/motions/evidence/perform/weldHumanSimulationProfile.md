# src/perform/weldHumanSimulationProfile.ts#weldHumanSimulationProfile

## @evidence contracts/development/common.md#meaningful-documentation

States what is welded, why, at which pose, how mass is combined and how the fingers are then shown.

## @evidence contracts/development/implementation.md#principled-implementation

Rigid welding moves each part's centre and inertia frame into the hand frame by the relative transform and sums them by the parallel-axis theorem; the profile's centre is recomputed from the new segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Finds the welded segments, folds each into its hand, then rebuilds joints and exclusions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A profile without hand segments is returned with the same segments; no mass is dropped and no collider is removed.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B + J) for B segments and J joints, once per window.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh profile; retains nothing.
