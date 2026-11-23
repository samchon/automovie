# src/internal/fitRecoveryHomography.ts#fitRecoveryHomography

## @evidence contracts/development/implementation.md#principled-implementation

Independent centroid/mean-distance normalization balances the original 2N-by-9 projective design. Original-design SVD supplies its null vector and rank diagnostic; chart denormalization precedes a separate 3-by-3 singular inverse and forward/backward transfer measurements by the caller.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This planar competitor remains separate from calibrated epipolar fitting because a good homography explains an ambiguity rather than a nonplanar camera baseline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal equations, diagonal ridge, selected plane, guessed inverse or truth camera rescues degenerate correspondence geometry; nonrepresentable inverses throw.

## @evidence contracts/development/common.md#meaningful-documentation

Defines map direction, pixel-centre chart, independent normalization, original-design rank test and lack of depth authority.

## @evidence contracts/development/implementation.md#efficient-algorithms

N correspondences require O(N) storage and O(S*N*9^2) bounded design rotations plus fixed 3-by-3 inverse work; scoring a changed subset needs its own normalization.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One fitted matrix and inverse serve all candidate scoring; the inverse uses the same 3-by-3 factors for all entries rather than repeated solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only two owned nine-number matrices and the rank ratio return; normalized points, factors and designs are call-local with no retained cache or handle.
