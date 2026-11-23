# src/internal/mixRecoveryFeasibleSqpStep.ts#mixRecoveryFeasibleSqpStep

## @evidence contracts/development/implementation.md#principled-implementation

Each original affine inequality and the objective define a scalar interval on the same segment. A gamma_(4k+16) dot/interpolation scale moves its bound inward; a newly materialized candidate must still pass raw original feasibility, active strictness and objective descent without an allowance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The current owner supplies already admitted physical directions and rows; only the coefficient changes. Nominal and at most one numerical candidate have distinct results.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There is no fixed weight floor, repeated next-float search, row deletion, residual clipping, tolerance change or success fallback. An empty/unresolved segment returns null for the original step owner.

## @evidence contracts/development/common.md#meaningful-documentation

Uses physical coordinates and preserves rho0 before considering computed equality error. The scaling is a numerical support heuristic; the direct returned-row checks, not an interval theorem, decide support.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two O(n+Z+m) candidate checks and one complete interval scan use bounded outward neighbours and O(n) vectors, prepaid in the auxiliary owner reserve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same rows and two qualified direction candidates are reused without a new metric, factor, objective evaluation or geometry trial.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner admits at most two simultaneous candidate vectors before calling. Only the supported vector and scalar status transfer; no trajectory is retained.
