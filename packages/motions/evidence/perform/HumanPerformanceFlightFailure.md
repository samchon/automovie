# src/perform/HumanPerformanceFlightFailure.ts#HumanPerformanceFlightFailure

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes raw action goals, displayed articulation and root-frame FK, states units and exact adjacent-time observation, and limits the continuity inference.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the same pure plan and composed pose at the takeoff and adjacent representable film seconds. Root-identity FK uses the same displayed articulation as HumanPerformanceFlight, so world root translation is not mistaken for a shape change. Raw action-local times retain the actual subtraction/clamping roundoff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capture three bounded observations, independently record a secondary read problem, then enrich and rethrow the same failure through the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second film, runtime override, alternate pose resolver, tolerance change or blend enters the model. Neighbouring times are observations after failure, never new integrator nodes or an admission rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only the failure path reads three displayed poses and three raw postures, followed by their linear FK and numeric copies. Successful planning never constructs this context.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the caller's unchanged body, plan and displayed-pose reader; each displayed pose serves both its clinical snapshot and FK. An optional original operation supplier shares exact body-owned dependency rows between the full displayed fit and its root-null full-bone FK; every authored joint is still admitted and raw-law observations retain their original calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The error retains three copied numeric/string/boolean snapshots, linear in rig bones/goals. Temporary poses, raw postures, bone maps and one eight-byte neighbour view end here; the optional supplier remains with the caller's operation. No body, plan, history, reader or callback escapes in the error.
