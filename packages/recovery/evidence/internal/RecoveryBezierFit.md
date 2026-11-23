# src/internal/RecoveryBezierFit.ts#RecoveryBezierFit.fit

## @evidence contracts/development/implementation.md#principled-implementation

Physical-arclength-weighted two-by-two normal equations solve positive handle distances along fixed endpoint tangents; four safeguarded Newton updates improve correspondence before adaptive splitting. Closed input starts with two arcs, and coincident arc endpoints receive the same adaptive error assessment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An explicit work stack avoids recursive call-stack growth; local closures share the admitted point chart and output budgets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No corner is invented, no observation is dropped and unsatisfied terminal spans remain marked. A singular or negative handle solution falls back to one-third chord handles and is subjected to the same error calculation.

## @evidence contracts/development/common.md#meaningful-documentation

Names the algorithm, tangent continuity, millimetre errors, fallback and finite-polyline limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N observations and S spans, balanced splits cost O(N log S), worst-case O(N squared), with constant four Newton rounds per candidate and O(N+S) live storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each candidate reuses its parameters, derivative nets and endpoint tangents across evaluation; there is no mutable-input cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The work stack and observation copies expire on return or throw; only S coefficient spans and scalar diagnostics escape.
