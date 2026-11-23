# src/internal/solveRecoveryMapJointStep.ts#solveRecoveryMapJointStep

## @evidence contracts/development/implementation.md#principled-implementation

Every point's undamped three-column design and the undamped reduced camera design are independently rank checked. Identical point/camera column scaling and augmented damping define one full least-squares problem; orthogonal elimination and back substitution solve it without constructing a dense all-point design.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared current-block preparation serves this complete LS operation and a separate rank/metric-only operation. This API still computes all requested steps and its scaled gradient; geometric acceptance stays with the optimizer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No damped rank, epsilon inverse, normal equations, dropped residual or separately normalized camera supplies observability. Unresolved point blocks or the reduced camera design throw before a step is returned.

## @evidence contracts/development/common.md#meaningful-documentation

States variable gauge-fixed camera coordinates, point-local elimination, consistent damping, unscaled returned steps and independent undamped rank diagnostics.

## @evidence contracts/development/implementation.md#efficient-algorithms

With E observations, L points and C admitted camera columns, point elimination costs O((E+L)*C); reduced QR/SVD costs O(E*C^2+S*C^3). Storage is O(E*C+L*C+C^2), avoiding a dense (C+3L)-column factorization. Actual variable-width sizes are admitted before allocations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One shared preparation preserves original per-point scale/SVD/gradient order and serves both undamped and damped elimination. Stored triangles recover all point steps after the same reduced camera solve; no cross-state answer is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Camera/point steps and scalar diagnostics transfer. Explicit metric retention additionally holds O(L*C+C^2) owned current factors/scales for the feasible consumer; ordinary calls retain none. No borrowed observations, global cache or external handles remain.
