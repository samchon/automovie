# src/index.ts#createRecoveryPoseModel

## @evidence contracts/development/implementation.md#principled-implementation

F=K2-inverse-transpose [t]cross R K1-inverse. Three left SO3 generators give dR=[axis]cross R; two raw translation directions give dE=[basis]cross R. Positive-scale invariance of the full signed Sampson quotient cancels the updater's normalization. The least-aligned axis resolves two directions; exact orthonormality requires exact unit t.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local model owns calibrated parameter derivatives and passes generic matrix/cross algebra to engine; the optimizer consumes the same pixel chart for residuals and Jacobians.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite-difference step, expected camera, metric baseline or unconstrained nine-entry matrix supplies a derivative. A translation outside the admitted near-unit gauge or a nonrepresentable map throws.

## @evidence contracts/development/common.md#meaningful-documentation

States local coordinate units, left-update order, raw-direction and Sampson-scale meaning, calibrated F equation and absence of covariance/global-optimum authority.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six fixed-size calibrated matrices and one tangent construction require constant work and storage, independent of point count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The translation cross matrix and inverse-transpose calibration serve every derivative, while the returned tangent basis also drives the optimizer's matching pose update.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only six owned matrices and two tangent vectors return; call-local algebra retains no image, mutable calibration, cache or external handle.
