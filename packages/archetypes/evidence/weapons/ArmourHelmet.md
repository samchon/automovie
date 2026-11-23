# src/weapons/ArmourHelmet.ts#ArmourHelmet

## @evidence contracts/development/common.md#meaningful-documentation

States +Z front/+Y up, outer record extrema, fitted nominal radius and exact inner padding boundary, declared coarse domains and partial-specimen limits.

## @evidence contracts/development/implementation.md#principled-implementation

One fitted lattice has horizontal radius R/cos²(alpha) and vertical radius R/cos(alpha), so its angular quadrilateral planes all have offset R=cavity+plate. One global cavity/R homothety preserves every shared edge and normal gauge. Unfitted ellipses use one inner factor 1-plate/minimum face support, preserving shared corners with at least the authored gauge. The bowl base inner course supplies the brim opening, and the source rim must contain that course strictly for a positive joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare one bounded globally aligned lattice, emit its unchanged outer/shared inner courses with the surviving face domain and join the brim directly to the already generated base wall boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sphere or hidden box fills the cavity, missing visor/collar is not restored, exact historical opening proportions are not claimed, and a wall unable to preserve padding refuses rather than stretching its envelope.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed sixteen-sector coarse lattice emits at most96 bowl cells and16 brim cells. One admitted canonical cell per row serves circular sectors; an unfitted ellipse shares only its exact half-turn symmetry. There is no thin-wall resolution loop or repeated hull per equivalent sector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One profile/course defines all boundaries. Prepared cells share the same hull, mesh and local mass across proper Y rotations; anisotropic ellipse sectors share only exact half turns, never an arbitrary rotation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh scalar cells/corners and retains no caller state, previously completed mesh, rendering resource or global cache.
