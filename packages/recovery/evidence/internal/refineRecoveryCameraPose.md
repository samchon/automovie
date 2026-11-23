# src/index.ts#refineRecoveryCameraPose

## @evidence contracts/development/implementation.md#principled-implementation

Analytic signed Sampson derivatives and soft-L1 influence weights define a robust Gauss-Newton model. Column scaling balances its five angular/direction coordinates; original-design SVD checks local rank before Levenberg damping and solves the augmented design without squaring its condition. Decreasing actual robust cost admits a pose update.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This fixed-subset optimizer owns damping, actual-cost acceptance and termination; feature matching, consensus subset changes, four-pose selection and final physical qualification remain with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal equations, finite-difference Jacobian, ridge-derived observability, unconstrained matrix or expected pose replaces the calibrated five-coordinate fit. Exhausted iteration budgets remain nonconverged, and undefined arithmetic throws.

## @evidence contracts/development/common.md#meaningful-documentation

States soft-L1 pixel scale, column-scaled rank test, local five-coordinate geometry, 1e-8 numerical stopping tolerances, bounded damping and absence of global or covariance guarantees.

## @evidence contracts/development/implementation.md#efficient-algorithms

With N fixed matches and I admitted iterations, each step uses O(N) five-column algebra and bounded original-design SVD work O(S*N*5^2), with O(N) scratch. The finite caller iteration budget limits accepted and rejected trials together.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An accepted current linearization supplies column scales, rank, gradient and step factors; a rejected trial reuses that unchanged local model on its next damping attempt, while a changed pose rebuilds it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous owner retains only its current/trial pose, local arrays and scalar diagnostics. Returned pose and counters transfer without input observations, image buffers, processes or global cache.
