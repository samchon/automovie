# src/posture/HumanQuadraticValue.ts#HumanQuadraticValue

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original upper-band quadratic traversal and soft l1 penalty; at the admitted origin, finite coefficients times zero produce the same zero accumulators without reading their products again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One numerical owner serves public QP.value and the fit's admitted-origin and actual-step reads; an optional local observer consumes the very same computed soft-row excess.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all nonzero coefficients, duplicates, scalar associations and interval expressions. Only finite x permits exact-zero omission, whose signed-zero addends leave the positive-zero accumulators unchanged; nonfinite x retains the original full traversal. Narrow curvature bands still require the owning producer's exact-zero premise; no tolerance or overflow result changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

With w=curvatureBand+1, m rows and R soft-row entries, evaluation costs O(n*w+R+m), including one O(n) finite-x proof; finite x avoids multiplications and vector reads for exact-zero off-diagonal/row coefficients. Private diagonal fits use w=1, origin costs O(m), and no numeric scratch is allocated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares each actual ordered row product/excess with same-call diagnostics and each current xi/P row across its curvature terms. One finite-x proof permits exact-zero products to be omitted; origin products are already proved zero. Every mutable problem/trial is read anew, without retained values or changed nonzero summation order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only scalar accumulators and synchronous borrowed inputs; retains no problem, vector, observer, model or result after returning.

## @evidence contracts/development/common.md#meaningful-documentation

Defines both evaluation modes, the finite-admission proof, units, ordered soft-row observer, side-effect premise and retained-data lifetime.
