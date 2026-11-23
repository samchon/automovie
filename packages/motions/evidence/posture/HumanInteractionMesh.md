# src/posture/HumanInteractionMesh.ts#HumanInteractionMesh.adapt

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the errors.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves Ho et al. 2010's inverse-distance Laplacian and the actual bone and contact constraints. Li et al. 2020's locally supported barrier acts on signed altitudes; positive curvature of the scalar barrier composed with the altitude gradient gives its projected Gauss–Newton term, and the cubic line filter keeps determinant signs positive. The original geometric tolerance and identity return still govern admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, mesh, coordinates, then a fixed-offset solution or a sparse local minimization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed input throws; no point is clamped after the solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolve constrained offsets by one graph walk where they determine every point. Other cases build one sparse model per iterate with barrier curvature only at compressed elements. Bernstein coefficients skip safe elements without a root isolation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The Laplacian, contact offsets and mesh topology are fixed for one adaptation. Line search trials reuse these even though their coordinates change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the current sparse terms and a fixed number of coordinate arrays, with no iterated trajectory or cached deformation.
