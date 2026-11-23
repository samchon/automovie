# src/internal/evaluateRecoveryScenePoint.ts#evaluateRecoveryScenePoint

## @evidence contracts/development/implementation.md#principled-implementation

Every retained measurement independently supplies positive depth and Euclidean pixel residual. World-space centre-to-point directions determine the strongest actual acute supporting pair, whose indices accompany the diagnostic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same point gate serves triangulation and post-joint qualification, separating observed support from seed-camera membership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No unregistered pose, invented missing observation, depth clamp, seed ray for an unseen point or low-error-only depth inference supplies acceptance.

## @evidence contracts/development/common.md#meaningful-documentation

States all-observation gates, strongest acute supporting pair and null metrics. Optional synchronous observation receives each registered positive-depth projection's raw residual norm before final qualification; it can be nonfinite for invalid measurements, is not an acceptance notification, and must not mutate borrowed inputs. Observer errors propagate unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

A track with k observations needs O(k) projections and O(k^2) angle comparisons, plus at most k observer calls whose work the caller admits and charges. The camera owner's O(1) scalar reduction per observation is included in its existing evaluation charge before traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each complete projection supplies depth and one residual norm to the gate and optional numeric reduction, avoiding a duplicate projection or depth multiplication. Each centre-to-point unit vector is computed once for every pair comparison.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar diagnostics and two view indices return. This evaluator retains neither observer nor projection history after return; any observer-owned retention belongs to its caller. The camera reduction retains two local scalars and discards them on later refusal. Local directions expire without input mutation or external resources.
