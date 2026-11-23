# src/physics/primitiveCentroid.ts#primitiveCentroid

## @evidence contracts/development/implementation.md#principled-implementation

Use symmetry for centered primitives and the solid cone centroid at +height/4 for the declared cone whose broad base is +Y; mesh positions and articulated placement are outside this primitive-local formula.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The primitive-kind switch owns local centroids; aggregate TRS and mass weighting remain in deriveCenterOfMass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Cone orientation follows tessellateCone's top-radius base, not a fixture convention; no measured result is substituted for a formula.

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies local metre coordinates, symmetric zero centers and the cone orientation that determines the centroid sign.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each closed primitive case requires O(1) arithmetic and a fresh vector, with no vertex scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

deriveCenterOfMass shares these canonical formulas; values are recomputed from the current primitive dimensions rather than cached by mutable identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the fixed-size returned vector escapes; there is no geometry retention or resource acquisition.
