# src/soft/solveSoftBodyCompliantSweep.ts#solveSoftBodyCompliantSweep

## @evidence contracts/development/common.md#meaningful-documentation

States the constraint, its gradient, the multiplier update with its source equations, the units of compliance, the bending form and the order.

## @evidence contracts/development/implementation.md#principled-implementation

XPBD's Gauss-Seidel update of each distance constraint with its own multiplier (Macklin, Müller and Chentanez 2016).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over edges in a fixed order sharing the lattice's neighbour table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A collapsed edge (zero current length) has no direction and is skipped, as the plain solver skips it; an edge between two anchors moves nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in particles times the twelve-slot stencil, with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each sweep reads the positions the last one left; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the caller's predicted and multiplier buffers.
