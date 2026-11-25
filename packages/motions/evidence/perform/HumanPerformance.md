# src/perform/HumanPerformance.ts#HumanPerformance.prototype.simulate

## @evidence contracts/development/common.md#meaningful-documentation

States what is baked, what the result shows where, what stays this performance's and why the call is asynchronous.

## @evidence contracts/development/implementation.md#principled-implementation

Kinematic motion with a solved window that blends back to it (Zordan, Majkowska, Chiu and Fast 2005, ACM TOG 24(3):697-701); the copy resolves the same input, a pure function of it, and adds the window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bake is HumanPerformanceSimulation's; this method stacks its reading on a copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

This performance is not changed; earlier windows stay under the new one.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bake; the copy resolves its own input again (`HumanPerformanceState.of`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The copy shares this performance's earlier readings rather than baking them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The copy retains the readings, each holding its completed simulation; no native handle outlives the bake.

# src/perform/HumanPerformance.ts#HumanPerformance.prototype.simulations

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the contents.

## @evidence contracts/development/implementation.md#principled-implementation

Returns the records the bakes produced.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the windows.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array of the retained records.

# src/perform/HumanPerformance.ts#HumanPerformance.prototype.fracture

## @evidence contracts/development/common.md#meaningful-documentation

Names the exact hit and when the model stays intact.

## @evidence contracts/development/implementation.md#principled-implementation

Looks up a recorded hit on the chosen subject and passes its film clock and this performance's prop reader to the breakaway planner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The performance supplies its existing event and prop placement. HumanPropFracture owns the split's staging.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No derived strike strength or fabricated hit. The named model owns acceptance of the authored budget.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selects the hit in one pass over the subject's records, then prepares one replacement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the performance hit and frame readers. Call once and sample the returned plan during playback.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The performance retains no fracture plans. A returned plan with a remainder borrows the performance's prop reader for its lifetime.
