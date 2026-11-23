# src/geometry/sweep/prepareAutoMovieSurfaceConstruction.ts#prepareAutoMovieSurfaceConstruction

## @evidence contracts/development/implementation.md#principled-implementation

Registers the actual sweep, frame and curve evaluator writers before sealing and reads them after all constraints; feature coordinates come from the same compiled feature spline as the displacement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates observation registration from its final read without adding another curve or surface implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sweep observation writers use zero-size cells and never enter the cage registry; network-curve observations read the actual curve rig. Neither changes registry cells or topology.

## @evidence contracts/development/common.md#meaningful-documentation

States registration/read ordering, shared evaluators, filtering distinction and ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) registration and reads for N requested points, plus the same surface queries used by the rig; allocates one writer per point until the final read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the rig's compiled sweep/curve and feature coefficients; no geometric representation is refitted for display.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The final read clears its O(N) temporary observation writers. Their registered frame and scale slots remain bounded by the requested samples and belong to the returned rig, whose pose updates still refresh them until that rig is released. Packed rest polylines are a separate caller-owned snapshot.
