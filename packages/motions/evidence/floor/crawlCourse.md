# src/floor/crawlCourse.ts#crawlCourse.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Every member states its role and coordinate or time unit.

## @evidence contracts/development/design.md#principled-representation

Names the existing gait's points, intervals and two lift heights directly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All seven inputs serve the existing crawl law and one query function.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Callbacks retain the law's exact arithmetic for event times and footprint positions.

# src/floor/crawlCourse.ts#crawlCourse.IProps.print

## @evidence contracts/development/common.md#meaningful-documentation

States the cycle-zero datum, world-metre result and unchanged-point lifetime used by of.

## @evidence contracts/development/implementation.md#principled-implementation

The caller supplies the law's nominal limb point translated by its body-scaled stride in the fixed floor frame; this signature exposes that authored footprint without solving another posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One limb/cycle callback is the sole footprint source for of, which stores each required point once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The contract keeps the caller's exact authored point and cycle index; it does not replace them with a sample or relaxed contact.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This method declaration chooses no implementation algorithm; crawl's callback is a constant-cost frame transform and of owns the finite preparation traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed law frame and stride make each limb/cycle footprint invariant; of requests it once and shares it across independent time queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The callback owns no handle or query history; of retains at most cycles plus one returned point per limb until its plan is released.

# src/floor/crawlCourse.ts#crawlCourse.IProps.lift

## @evidence contracts/development/common.md#meaningful-documentation

States local-second units, numbered domain and the increasing-boundary premise required by the search.

## @evidence contracts/development/implementation.md#principled-implementation

The caller supplies its unchanged down time plus numbered phase-offset periods, preserving the authored limb order and exact liftoff seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One callback owns each limb/cycle liftoff; of adds the supplied swing duration to obtain its touchdown.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original period, phase and contact window are supplied directly; no time tolerance or resampling is introduced here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This method declaration has no algorithm body; the current caller uses constant arithmetic and of owns interval preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A fixed down time, period and limb phase make every numbered liftoff invariant; of reads each once for all time queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The callback retains no queried time or result history; the owning course stores exactly one interval per authored limb/cycle until release.

# src/floor/crawlCourse.ts#crawlCourse

## @evidence contracts/development/common.md#meaningful-documentation

States preparation, the horizontal course and the vertical lift.

## @evidence contracts/development/implementation.md#principled-implementation

Binary search finds the first touchdown strictly after the query; its liftoff comparison retains the original half-open swing and closed planted endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns a small table per limb and the evaluator contains one boundary search and one interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same lift/print callbacks, minimum-jerk expression and lift polynomial are used at the same exact seconds; no sample or boundary tolerance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

L limbs and C cycles require O(LC) prepared points/times; each query is O(log C), replacing the original O(C) scan and repeated world transforms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only immutable authored footprints and exact event seconds are shared across time queries; no posture, solver result or previous query determines the course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains C+1 fixed points and C interval records per limb until its plan is released; every outward vector is fresh, so editing a query result cannot change another query.
