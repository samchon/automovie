# src/kinematics/resolveAutoMovieMomentum.ts#resolveAutoMovieMomentum

## @evidence contracts/development/implementation.md#principled-implementation

The angular momentum of a rigid multibody about its centre of mass is the sum of each part's orbital `m (c - C) × v` and spin `I ω` (any rigid-body dynamics text); the velocities are central differences, second order in the interval for sufficiently smooth segment trajectories, with the relative rotation's rotation vector for the angular one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pose both ends once, then delegate their ordered parts and centres to the shared interval reduction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bone or a non-positive interval throws; no momentum is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear segment passes pose both ends and reduce momentum with one centre transform per segment. Spins consume physical tensor scalars without temporary part arrays/rows, and orbital coordinates accumulate directly. Prepared intervals reuse copied-key and current-rate storage even on changes, omitting replacement cache records and per-read rate vectors; every actual reciprocal and product retains its original association.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoint centres serve mean/orbital terms; raw and between share reduceBetween. PrepareIntervals captures eight endpoint coordinates once per index and uses that same private tuple for Object.is, shortest-arc turn and midpoint frame; reuse becomes ready only after both results complete. Its tensor reader separately snapshots actual midpoint moments/rotation. Current points, masses, seconds and spin products always run; no momentum answer or mutable bone object is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct and between calls borrow endpoints and return fresh numeric records without retained state. PrepareIntervals owns one copied quaternion-pair/turn/midpoint, overwritten rate scratch and intrinsic slot per current part; it truncates on shrink and releases with its mass token. Rate scratch never escapes or supplies a cached answer, and no endpoint pose/model/target population is held.

## @evidence contracts/development/common.md#meaningful-documentation

States model, units, common frame, ordered endpoint snapshots, positive seconds, central differences and rigid-turn error. Namespace between borrows posed endpoints without retaining them; prepareIntervals lends one operation-owned exact quaternion/intrinsic reader while every actual interval rate and momentum sum remains current.
