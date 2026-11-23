# src/math/solveAutoMovieQuadraticStep.ts#solveAutoMovieQuadraticStep

## @evidence contracts/development/implementation.md#principled-implementation

Eliminates slack and homogeneous scalar equations to the symmetric KKT, then reconstructs delta tau/x/z/s/kappa. The orthant corrector is (s*z + damping*ds_aff*dz_aff - sigma*mu)/z and all equality slacks remain zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner evaluates one direction; factorization and residuals are supplied by their owners, while iteration selects centering and admissible step length.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The authored PSD diagonal stays unchanged and neither small coefficients nor unsolved factors are repaired into a successful direction; nonfinite reconstruction refuses.

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix reuse, scalar Schur complement, zero/orthant distinction, source derivation and affine-product correction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direction assembly/reconstruction costs O(n+m) plus one sparse refined solve; constant K^-1[-q;b] and numeric factors are shared by affine and combined directions of the iteration.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Receives the common constant solution rather than solving it again; affine direction supplies its product correction to the combined direction.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

RHS, offsets and returned direction contain O(n+m) doubles and remain within the current synchronous iteration; no cross-call state is retained.
