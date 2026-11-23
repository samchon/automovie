# src/internal/normalizeRecoveryImagePoints.ts#normalizeRecoveryImagePoints

## @evidence contracts/development/implementation.md#principled-implementation

Independent centroid and mean-distance normalization balances the image design before original-matrix SVD. A zero or unrepresentable spread cannot identify a projective fit and throws rather than receiving an epsilon scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fundamental and homography fits share the same image-normalization convention and receive the transform needed for explicit denormalization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point deletion, coordinate rounding, guessed spread or normal matrix repairs a degenerate observation set.

## @evidence contracts/development/common.md#meaningful-documentation

States the sqrt(2) mean-distance convention, original-pixel preservation, transform order and refusal cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three O(N) scans compute centroid, mean distance and normalized coordinates, with O(N) returned storage and one fixed transform.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One transform normalizes all observations of its current fitting set; a changed RANSAC subset has a different centroid/spread and is not cached as equivalent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Normalized points and one nine-number transform transfer to the caller; borrowed observations are unchanged and no state survives globally.
