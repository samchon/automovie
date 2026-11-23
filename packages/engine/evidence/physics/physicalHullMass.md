# src/physics/physicalHullMass.ts#physicalHullMass

## @evidence contracts/development/common.md#meaningful-documentation

States the decomposition, the exact quadrature, the frame of each result and that the moments are per unit mass.

## @evidence contracts/development/implementation.md#principled-implementation

Polyhedral mass properties by tetrahedral decomposition (Mirtich 1996, Fast and accurate computation of polyhedral mass properties; Tonon 2004, Explicit exact formulas for the 3-D tetrahedron inertia tensor): the degree-two quadrature with weights 1/20 at the four vertices and 4/5 at the centroid integrates every product of two coordinates exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the faces from `physicalHullFaces` and the diagonalization from `physicalPrincipalAxes`; it owns only the integration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance and no sampling: the sums are exact for the polytope; the non-null assertions index loops and 3x3 rows the function bounds itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the hull's triangle count, a few dozen for a body module, once per profile build.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A profile integrates each hull once while it is built; the face search behind it is already shared by `physicalHullFaces`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing between calls; its temporaries die with the call.
