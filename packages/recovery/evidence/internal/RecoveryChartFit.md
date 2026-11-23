# src/internal/RecoveryChartFit.ts#RecoveryChartFit.fit

## @evidence contracts/development/implementation.md#principled-implementation

Position and physical-gradient rows share exact affine coefficient identities; diagonal congruence preserves the declared least-squares objective and box, while termination evaluates the original projected-gradient mapping. Pivoted Cholesky reports numerical observation rank independently of residual and convergence; the enclosure does not create observational information.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sparse normal-equation assembly removes observation-count work from each iteration; final residuals still evaluate the original correspondences.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No regularizer, enclosure relaxation, coefficient clipping after solving, hidden smoothing or source mesh fallback changes the declared problem.

## @evidence contracts/development/common.md#meaningful-documentation

Numerical Gram rank uses a declared machine-scale pivot tolerance, not exact rank or a singular-value certificate; embedding and continuous source distance remain unproved.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N observations and reduced stencil width W, assembly costs O(N*W squared), with W at most 16 for identity-only controls or the explicit affine row cap (128 by default). I iterations cost O(I(H+M)); storage is O(H+M) plus bounded substitution expressions. Rank diagnostics use O(M squared) memory only up to 512 unknown controls and direct QR has a separate 50000000 scalar-projection budget; unavailable diagnostics retain an unqualified finite candidate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed contributions, normalized weights, sparse Hessian, right-hand sides and row-sum spectral bound are assembled once and reused by every gradient iteration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Observation arrays remain caller-owned; sparse normal equations and the bounded dense rank workspace expire on return, while coefficients, scalar diagnostics and one bounded private witness return to the caller. The public observer removes that witness into a separate private sidecar.
