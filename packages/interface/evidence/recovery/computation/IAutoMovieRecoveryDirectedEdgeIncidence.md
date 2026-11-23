# src/recovery/computation/IAutoMovieRecoveryDirectedEdgeIncidence.ts#IAutoMovieRecoveryDirectedEdgeIncidence

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes current mesh vertex/triangle indices from original source-face provenance after subdivision.

## @evidence contracts/development/design.md#principled-representation

Ordered endpoints retain edge direction; face addresses the same current mesh, with integer and range admission owned by RecoveryFeatureChartCutsTopology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Feature-cut topology, subdivision and seams exchange this one incidence record through their undirected edge registry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record preserves face occurrence and direction even when another edge has identical positions; it is not a Cartesian vector.
