# src/perform/placeHumanSimulationColliders.ts#placeHumanSimulationColliders

## @evidence contracts/development/common.md#meaningful-documentation

States which solids enter, how each moves, which are left out and why, the material and the mass.

## @evidence contracts/development/implementation.md#principled-implementation

Static and moving solids enter the rigid world as kinematic bodies, the standard treatment of animated scene geometry in a rigid-body solver (the solver's kinematic bodies, moved to a set pose each substep); a prism is the convex hull of its footprint's corners at both heights.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the props and one over the obstacles, each building one body; the reach test is shared.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An obstacle the window cannot model is refused rather than dropped; a gripped prop is left out by its grip record, not by name.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N * (S + 1) * K) for N candidate solids with K colliders over S steps, once per bake.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of the performance at the window's steps.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh bodies and box; retains nothing.
