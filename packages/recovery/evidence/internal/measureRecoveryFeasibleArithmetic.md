# src/index.ts#measureRecoveryFeasibleArithmetic

## @evidence contracts/development/implementation.md#principled-implementation

If exact mass M lies in [L,U], the normalized aggregate differs from the computed aggregate by at most (formationError+norm(aggregate)*max(abs(L-1),abs(U-1)))/L. Each price adds its row one-norm times this error and its sequential dot bound; minimum endpoints bound the exact normalized minimum. Weighted price and pricing-sum errors bound the gap discrepancy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Recovery interprets the numerical dual while the engine retains its computed gap and termination. The caller still checks actual returned rows and original physical KKT separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stored residual is changed, no weight or row is dropped, and no numerical allowance certifies budget exhaustion or nonlinear convergence.

## @evidence contracts/development/common.md#meaningful-documentation

Bounds assume finite arithmetic, positive exact mass and q*u<1; overflow refuses. They apply to the Float64 rows and weights, not uncertain photographic data.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two sparse scans and one coordinate scan cost O(Z+m+n). Together with the caller's row certificate/report, at most 40+32m+8Z outward-neighbour calls each touch six buffer scalars. The caller reserves 256Z+1024m+128n+1024 visits for these accesses, sparse/record scans and fixed bound calculations before execution.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The completed minimizer's immutable weights, aggregate and minimum are reused without a second solve or retained prices.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fixed scalar locals/result are added; the caller reserves 128 fixed slots. The existing adjacent-float primitive retains eight shared scratch bytes and allocates nothing per call.
