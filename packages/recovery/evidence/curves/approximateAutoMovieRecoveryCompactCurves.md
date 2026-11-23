# src/curves/approximateAutoMovieRecoveryCompactCurves.ts#approximateAutoMovieRecoveryCompactCurves

## @evidence contracts/development/common.md#meaningful-documentation

States papers, adaptation, units, charts, hard corners, observation-only knots, sampling and incomplete-budget semantics.

## @evidence contracts/development/implementation.md#principled-implementation

Endpoint-tangent least squares extends Schneider's construction to bounded degrees; original-design engine SVD avoids squared conditioning. Adaptive subdivision and independent-node distances admit candidates under explicit sampled premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Call-local observation, candidate fit, verification and subdivision own separate steps; existing engine algebra and Ahn conic fitting retain their numerical responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No degree elevation, source mesh, specimen table, tolerance relaxation, numerical ridge or fabricated missing interval supplies output. Negative handles and unresolved numerical rank refuse their candidate.

## @evidence contracts/development/implementation.md#efficient-algorithms

With N supplied source supports, L visited leaves and Q permitted callbacks, fixed degree at most five bounds each design width by six. Balanced subdivision observes O(N log L) nodes; binary searches restrict each support scan to its interval. Callback, leaf and depth budgets bound retained work; no global optimality or unmeasured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact-parameter source points are snapshotted once and reused across degrees, fitting and verification; one candidate SVD solves every unknown on its original weighted design.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most maximumQueries cached observations and maximumPieces leaves survive within the synchronous call. Only compact coefficients and scalar evidence escape; no callback or process is retained.
