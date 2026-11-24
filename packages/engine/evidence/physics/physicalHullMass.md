# src/physics/physicalHullMass.ts#physicalHullMass

## @evidence contracts/development/common.md#meaningful-documentation

States the outward face decomposition and exact quadrature. The result contains shape-local mass properties in metre units, and inertia components are per unit mass. The prepared path borrows an admitted set of supporting faces.

## @evidence contracts/development/implementation.md#principled-implementation

Integrates the outward face fans by tetrahedral decomposition and diagonalizes the same moment tensor through `physicalPrincipalAxes`. The degree-two quadrature uses weight 1/20 at each vertex and 4/5 at the centroid. Mirtich (1996) derives the polyhedral mass calculation, and Tonon (2004) gives the exact tetrahedral inertia formulas.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The point-set entry gets its supporting faces from `physicalHullFaces`. The prepared hull entry passes its supplied faces to the same integrator. The mass owner handles only integration and principal axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both entries use exact polytope quadrature and share the empty or zero-volume refusal. The bounded fan and matrix indices supply the loop premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs linear work in the number of triangles of the supporting face fans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A caller that already read the supporting planes can pass that hull to the integrator directly. The point-set entry shares existing hull admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Both entries borrow faces during the call and return a fresh result. The returned mass record retains none of that scratch.
