# src/soft/projectSoftCordSelfContact.ts#projectSoftCordSelfContact

## @evidence contracts/development/common.md#meaningful-documentation

States the segment model, closest-point and friction sources, constraint gradients, fixed-per-call grid and discrete/coincident-contact limitations.

## @evidence contracts/development/implementation.md#principled-implementation

Ericson's segment-segment closest points, a position-based non-penetration constraint (Müller et al. 2007) and position-based Coulomb friction (Macklin et al. 2014).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A grid pass for candidates, then one projection per candidate pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adjacent segments are excluded, zero closest distance is skipped and all-anchored pairs cannot move; these limits do not establish separation or absence of tunnelling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in segments for the grid, then linear in candidate pairs; a cord in contact with itself only near a crossing checks a few neighbours per segment.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads the positions the last constraint pass left; the grid is rebuilt because they move.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The grid is call-local; only the caller's predicted buffer is written.
