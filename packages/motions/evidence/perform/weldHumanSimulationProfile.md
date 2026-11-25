# src/perform/weldHumanSimulationProfile.ts#weldHumanSimulationProfile.of

## @evidence contracts/development/common.md#meaningful-documentation

States the weld set and its source, what each weld folds into which carrier, at which pose, how mass is combined and how the welded bones are then shown.

## @evidence contracts/development/implementation.md#principled-implementation

The weld set is the MuJoCo humanoid's, google-deepmind/mujoco `model/humanoid/humanoid.xml` at 395129bbd3976e9e6163ab5d3c480234f665d55a (Apache-2.0, "Copyright 2021 DeepMind Technologies Limited"): `hand_right`, `hand_left` and `head` carry no joint, and the feet are leaf bodies with no toes. The rig's neck, absent from that model, rides with the head into the chest. Rigid welding moves each rider's centre and inertia frame into its carrier's frame by the relative transform of the profile's neutral pose, as a MuJoCo body without a joint keeps the pose its model defines relative to its parent and sums them by the parallel-axis theorem (`combinePhysicalMassProperties`); the profile's centre is recomputed from the new segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Marks each weld root's subtree with its carrier, folds each rider into its carrier, then rebuilds joints and exclusions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A profile without a weld root's joint keeps that subtree; no mass is dropped and no collider is removed, each rider's collider keeping its own id under its bone's name.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B * W + J) for B segments, W welded bones and J joints, once per window.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh profile; retains nothing.