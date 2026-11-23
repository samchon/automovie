# src/internal/fitRecoveryEpipolarMatrix.ts#fitRecoveryEpipolarMatrix

## @evidence contracts/development/implementation.md#principled-implementation

Independent image normalization balances the eight-point design. Its eighth/largest original singular-value ratio tests identifiable row rank, its last right vector supplies the homogeneous solution and a separate 3-by-3 SVD imposes rank two before explicit chart denormalization.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This camera-specific initializer uses generic engine decomposition and matrix products; consensus and calibrated refinement own the later pixel objective and acceptance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No A-transpose-A eigensystem, ridge, discarded correspondence, forced singular floor or expected pose substitutes for a weak design. Nonrepresentable or rank-ambiguous inputs throw.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the epipolar equation, normalization/rank-two order, operational design ratio, homogeneous sign convention and algebraic-initializer limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N matches, the nine-column original design requires O(N) storage and O(S*N*9^2) bounded Jacobi work; the rank-two projection and chart composition have fixed dimensions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each image transform serves its complete current subset and the same generic factorization provides rank diagnostics and the null vector. Changed subsets require new normalization and are not reused blindly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary normalized points, design and factors expire synchronously; only nine F entries and a rank ratio return. No source image, external handle or cache is retained.
