# src/motion/steerAutoMovieCrowdContacts.ts#steerAutoMovieCrowdContacts

## @evidence contracts/development/implementation.md#principled-implementation

Overlap of two discs is their summed radii past their centres' distance; of a disc and a footprint its radius past the signed distance; both read on the integrator's own knots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the knots; each knot places the footprints, reads every agent's arrival and overlaps, and drops the overlaps that ended.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Overlaps are reported, never repaired; the 1e-9 m roundoff floor and the two-knot rule are the original pass's.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K (N^2 + N M)) for K knots, N agents and M obstacle edges; each obstacle's footprint is placed once a knot and each destination read once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A footprint placed at a knot serves every agent there.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one open record per overlapping pair until it ends; returns fresh arrays.

## @evidence contracts/development/common.md#meaningful-documentation

States the arrival and contact rules, the inputs' orders and the result.
