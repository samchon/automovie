# src/geometry/subdivisionRingEigenbasis.ts#subdivisionRingEigenbasis

## @evidence contracts/development/implementation.md#principled-implementation

The limit and tangent masks of a stationary subdivision scheme are the dominant left eigenvectors of its local subdivision matrix; power iteration and orthogonal (subspace) iteration are the standard methods for a few dominant eigenvectors of a small non-symmetric matrix, and projecting onto zero-sum masks removes the eigenvalue-1 direction exactly because `S` maps constants to constants. The precondition is that the two tangent eigenvalues dominate the rest, which is what tangent-plane continuity at the vertex means; where the scheme is not tangent-plane continuous there is no limit normal to find.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The matrix is derived from `stepSubdivisionRing`, so it cannot drift from the rules actually applied; the masks it yields are applied here, and orientation stays with the caller, which knows the sector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The iteration count is fixed rather than a tolerance loop, so every host performs the same arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix, why its eigenvectors are the masks, both iterations and the re-orthonormalisation, which classes use it, the convergence rate and the precondition.

## @evidence contracts/development/implementation.md#efficient-algorithms

For ring size `d` (one plus edges plus diagonals), building `S` costs `d` ring steps of `O(d)`, and each of `EIGEN_STEPS` iterations costs `O(d^2)` for three vectors; it runs only for darts and three-face crease sides.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each ring's matrix depends on its own valence and sharpness and is used once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one `d` by `d` matrix and three length-`d` vectors, released on return.
