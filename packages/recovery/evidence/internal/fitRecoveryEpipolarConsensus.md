# src/internal/fitRecoveryEpipolarConsensus.ts#fitRecoveryEpipolarConsensus

## @evidence contracts/development/implementation.md#principled-implementation

Original-design normalized eight-point proposals, equal-singular essential projection and signed pixel Sampson support define one calibrated objective. Up to the caller's L eligible proposals receive five-coordinate local optimization before winner comparison, because raw support is not an upper bound on refined support. A still-changing subset may supply a provisional hypothesis only when every continuous fit converged; independent final refits must stabilize before qualification. Neither fit residual nor ideal sampling target proves material correspondence or camera truth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner coordinates reproducible proposal identity, full-population scores and local-subset convergence; final physical pose selection, planar ambiguity and source publication remain separate responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No raw winner suppresses an eligible local attempt within the explicit budget. No uncalibrated-F residual qualifies a pose, no older inlier fraction supplies final confidence, and no truth camera, normal equations, exhausted optimizer or ignored unexpected error becomes a winning local refinement. A provisional changing subset does not inherit final convergence.

## @evidence contracts/development/common.md#meaningful-documentation

States calibrated scoring order, domain-separated seed, minimum/maximum trials, local proposal budget, final-target continuation, numerical refusal counts and conditional sampling limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

T proposals over M matches require bounded nine-column SVD plus O(M log M) scoring per proposal. At most the declared L proposals with eight calibrated inliers receive three bounded local fits in draw order, independent of winner score; final target readjustments strictly advance trial work, so at most T final re-estimations occur. O(M) current/best scratch and only the last refit's diagnostics are retained. Exhausting the local budget can miss a better basin and the ideal sampling target does not bound that risk.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each calibrated proposal scores all tentative matches once. Successful local work replaces a proposal only on a better complete score, and unchanged final support terminates immediately; changed support updates the conditional target before any further draw.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous owner returns one best matrix, O(M) indices, the last at-most-three fit summaries and scalar counters; replaced proposals and local arrays expire without images, handles, callbacks or global state.
