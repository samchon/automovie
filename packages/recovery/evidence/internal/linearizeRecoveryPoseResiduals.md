# src/internal/linearizeRecoveryPoseResiduals.ts#linearizeRecoveryPoseResiduals

## @evidence contracts/development/implementation.md#principled-implementation

The quotient derivative of signed Sampson distance uses both epipolar lines and the calibrated model's five analytic matrix derivatives. Norm-normalized dot products avoid first squaring the full denominator, and no derivative denominator is floored.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This point pass owns the residual equation used by the local optimizer, independently of robust weighting and step selection; the same supplied pixel charts remain fixed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No finite-difference perturbation, omitted normalization derivative, zero residual replacement or expected camera supplies a Jacobian. Undefined or nonfinite arithmetic throws.

## @evidence contracts/development/common.md#meaningful-documentation

Gives signed pixel units, the complete derivative equation, the five local coordinates inherited from the model and the undefined-line failure effect.

## @evidence contracts/development/implementation.md#efficient-algorithms

N points and five fixed derivatives require O(N) work and O(5N) returned Jacobian storage; six transposes are prepared once, and no image or design factorization is traversed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Base incidence and line norm serve all five derivatives at each correspondence; model derivatives are shared over the complete current fitting set.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only owned residual and Jacobian arrays return; no borrowed observations, calibration, image buffer or external handle remains after return or throw.
