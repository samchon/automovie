# src/everyday/fitSeatedAnkleCrossSweep.ts#fitSeatedAnkleCrossSweep

## @evidence contracts/development/common.md#meaningful-documentation

States when a projection certifies a pair and that the exact distance stays authoritative.

## @evidence contracts/development/implementation.md#principled-implementation

A pair is certified apart along an axis when the projected solids are farther apart than the swept displacement bound: the axial projection of Gottschalk, Lin and Manocha (1996) section 5 with a displacement bound as in Tang, Kim and Manocha (2009); roundoff is bounded by 64 binary64 operations; otherwise the exact pair distance is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `fitSeatedAnkleCross` as its sweep certificate; the fit asks it for each pair's clearance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A borderline projection falls to the exact query; nothing is accepted by tolerance alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

A retained witness plane per fixed and moving shape turns repeated pairs into one projection; a miss costs one nearest-point query and at most one exact pair query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Witness planes are reused for the same fixed collider and moving shape within one fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader keeps at most one plane per fixed collider and moving shape, released with the fit.
