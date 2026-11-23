# src/index.ts#predictRecoveryMapDecrease

## @evidence contracts/development/implementation.md#principled-implementation

Minus gradient dot u minus half sum(Jw*u)^2 is the decrease of the original current weighted-GN model. Each row combines its dense camera part and local point part before squaring; no damping penalty or trial reweighting changes that model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A streaming design action serves accepted-step metric reactions without a dense Jacobian, Gram matrix or metric subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Wrong physical width, row layout or nonfinite gradient, increment or Jacobian throws as a core error. Nonrepresentable arithmetic returns null rather than a fabricated positive prediction; neither status qualifies a nonlinear candidate.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are borrowed current-base arrays and the exact chosen retraction increment; the finite return is a computed squared-pixel decrease and may be nonpositive, while null means arithmetic support is unavailable.

## @evidence contracts/development/implementation.md#efficient-algorithms

E observations, L points and C camera coordinates require O(E*(C+3)+n+L) visits and constant scratch. The owner precharges32*(E*(C+4)+n+L+1) before this scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Retained current weighted blocks and gradient are used directly; there is no projection, factorization, retraction, new residual population or trial.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed design, gradient and increment remain unchanged. Only scalar accumulators live during the call; the owner releases its current design after the reaction.
