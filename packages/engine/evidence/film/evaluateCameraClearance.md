# src/film/evaluateCameraClearance.ts#evaluateCameraClearance

## @evidence contracts/development/implementation.md#principled-implementation

Uses an inclusive slab test for a swept-sphere capsule against an inflated box; r(1-cos(theta/2)) bounds a constant-speed rotation arc's chord deviation under fixed camera scale. Linear translation and endpoint-contained obstacles are additional premises. Normalized-lerp deviation and unconstrained direct-call scale changes are not certified by that sagitta.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure evaluator over an explicit sample plan, with box, slab and arc helpers private to it; reading shots, models and violation paths belongs to `compileCameraClearanceReports`, so this function can be checked on hand-built samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no camera or obstacle; malformed plans throw instead of being repaired, contact at exact equality blocks rather than being forgiven by a tolerance, and obstacle order uses the shared `compareCodeUnits` rather than the host locale.

## @evidence contracts/development/common.md#meaningful-documentation

States the sweep, the radius terms, the contact rule, the single-sample and stale cases, the premises and their limitation, the finding order, the report states and every thrown condition.

## @evidence contracts/development/implementation.md#efficient-algorithms

After sorting obstacle ids and building per-sample maps, visits each interval, sphere part and obstacle with one constant-size slab test. This is O(intervals × parts × obstacles) plus indexing/sort costs; no small obstacle population or measured acceleration comparison is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one take's plan; sharing obstacle states across takes is done by the clearance compiler before calling it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after return; the per-sample obstacle maps, bounded by samples times obstacles, are locals, and the returned report copies the sample times and holds only its findings.
