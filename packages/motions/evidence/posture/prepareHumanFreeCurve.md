# src/posture/prepareHumanFreeCurve.ts#prepareHumanFreeCurve

## @evidence contracts/development/common.md#meaningful-documentation

Defines curve ownership, normalized phase/second units, canonical directed dyadic interval construction, exact current solves, supported free-goal domain, full physical gates and cold fallback. An accepted interval endpoint is not a global smoothness certificate.

## @evidence contracts/development/implementation.md#principled-implementation

Predictor-corrector continuation uses the existing near-basin hinged solver. A directed interval's actual endpoint correction either meets the original branch/swivel and one-degree postclamp rotation gates or requires deterministic left-before-right subdivision. Every actual query is independently corrected and checked for ankle position, requested orientation, pole side and ROM with those same gates. Query-local failure can descend without changing the parent's canonical classification. A unique smooth local basin remains a premise; sampled endpoints do not certify global C1 or analytic root selection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One correct/observe pair owns all actual fit and physical gates (`HumanFreeCurveFit`). interval and boundary (`HumanFreeCurveIntervals`) read the curve's interval records through a named scope; the curve keeps its origin, pivot and support state with solve and prepare. interval retains canonical endpoint classification; boundary constructs canonical preceding anchors; solve selects that prepared interval then actually fits the current target. A usable phase-zero or midpoint anchor starts the hierarchy; absent both, the original one-sided cold-reference policy remains. Precision-limited or physically unusable cases use cold fitting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No body/law/fixture switch, approximate result key, sampled global certificate, fixed physical grid, skipped bound, interpolated pose or whole-pose cache is used. Every target still runs the actual fit and full checks. Query-dependent failures never mutate another target's canonical choice. Unsupported contexts retain ordinary cold fitting.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C retained intervals and depth D, selection uses O(D) map lookups and normally one current correction instead of repeating the same coarse failures and recursive anchor reconstruction. The geodesic triangle inequality can reject a canonical endpoint before IK when its requested foot turn exceeds the sum of both acceptance radii and the angular roundoff reserve. Remaining boundaries pay actual correction/subdivision. Endpoint classification is reused while resident; eviction may recompute it. Each correction retains actual demanded FK and changed-tuple ROM scoring. C is bounded by the numerical-retention budget, not by weakened angular resolution; gains remain unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact directed dyadic boundaries under the same immutable curve and live rig identify one canonical left-anchor construction. Only primitive seeds, quaternions and endpoint classification share; every requested target is fitted afresh through the existing exact continuous-policy memory. No child links affect construction after eviction. ROM memoization still requires exact current nullable coordinates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A curve owns at most 1024 unlinked numerical interval records, one origin, fixed ROM scorers/last tuples, at most four observed-bone sets with their bound demands (one per sequence of leg goals), and one cold-reference anchor per finite binary64 level when no origin exists. Recursive boundary construction owns O(D) temporary anchors; adjacent midpoint collapse ends refinement. Rig invalidation clears all numerical populations. No pose, output history, FK loan, callback handle or task is retained in interval data.
