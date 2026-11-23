# src/kinematics/distalEndSwivelArcs.ts#distalEndSwivelArcs

## @evidence contracts/development/common.md#meaningful-documentation

States the premise, where the derivation of both readings lives, what the arcs leave to the caller and when the result is null.

## @evidence contracts/development/implementation.md#principled-implementation

A distal twist leaves the mid segment's direction unchanged and the end joint's twist is immobile, so its two angles are read off that direction in the requested rotation's frame; the direction is affine in the mid joint's place, which circles the root-to-target line, so each bound is a sinusoid of the swivel with exact roots (Tolani, Goswami and Badler 2000, after Korein: the elbow's restriction as a function of the wrist joints).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared readings, the two angles' bounds and one union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact roots, never sampling; a joint or an interval the analysis does not cover returns null rather than a guess, and the margin is the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three directions, nine dot products, at most four arcs and one merge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The readings are `distalEndSwivelReadings`'s, shared with the least rotation miss; the arcs and their union are `swivelArcs`'s, shared with a root joint's box.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
