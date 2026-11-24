# src/perform/HumanSegmentShown.ts#HumanSegmentShown

## @evidence contracts/development/common.md#meaningful-documentation

States the pose, when a record accompanies it and when none does.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the last placed segment whose entry is at or before the second with the existing 1e-12 allowance, then uses its displayed evaluator or the initial standing pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, one reverse last-match selection on a miss, one evaluation and bounded insertion of the new record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

While the schedule is being resolved a pose is shared only within one action's planning (`HumanSegment.planning`), never across a placement. Observational requests read and keep the whole pose where poses are kept, so a second is resolved once for all its readers, and never store partial results; public whole-pose queries remain complete at exact seconds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Hits cost one map lookup; a second where the pose holds still back to an earlier one (`HumanSegmentStill.representative`, two selections) takes that second's pose, evaluated once for the whole stretch; misses inspect R entries from the end, at most S segments, and pay the selected evaluator's fitting cost, retaining at most 4096 records per person.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A still stretch shares one evaluation, which `HumanSegmentStill.within` proves equal at every second of it (no term of the shown pose changes there). Exact film-second queries share completed poses only after placement is settled; HumanSegment.forget clears them when plans, stops or placement dependencies change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The person owns the FIFO-bounded 4096-entry map and releases it on forget; returned pose references retain their existing borrowed ownership, with no copy or new process-wide cache.

# src/perform/HumanSegmentShown.ts#HumanSegmentShown.laid

## @evidence contracts/development/common.md#meaningful-documentation

States which overlays the read sees and why.

## @evidence contracts/development/implementation.md#principled-implementation

The person's overlays are those placed before the reading overlay for the read's synchronous span, the state its planning saw; every display term (carrier, earlier overlays, carries, fits) is evaluated as usual.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scoped swap of the person's own overlay list and pose records, restored in finally.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pose read under the scope is kept only in the scope's own fresh records, never in the person's, which hold the whole display.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nothing is swapped when no overlay is left out (a read while the overlay is planned); otherwise one pose evaluation per second the read demands, shared within the scope.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the ordinary display evaluation and its records, scoped to the laid state; nested scopes restore the enclosing one.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scope's records are released on return or throw, when the person's list and records are restored.

# src/perform/HumanSegmentShown.ts#HumanSegmentShown.IRead

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

## @evidence contracts/development/design.md#principled-representation

The pose and its optional kept record, as `of` returns them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The return of `of` and its evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record is the person's own.

# src/perform/HumanSegmentShown.ts#HumanSegmentShown.bones

## @evidence contracts/development/common.md#meaningful-documentation

States which pose's bones are returned, when its admission is shared, the unkept case and the fresh result.

## @evidence contracts/development/implementation.md#principled-implementation

A reading holds one admission's articulations and root and composes bones by the products forward kinematics of the pose uses, so the bones of a kept pose read from it are those a resolve of that pose returns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One displayed record; it carries the reading, and an unkept pose goes to the ordinary reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A kept pose is the person's own record, replaced only by `HumanSegment.forget` and the planning's clearing, so the reading is never compared or looked up apart from it; a caller that edits a kept pose in place edits the person's record and is outside this reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

A kept pose costs one O(J) admission over all its bone readers and K copies a read; an unkept one costs the ordinary admission and demanded ancestry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The readers of one kept pose share its reading because they read the same record of the same person at the same second under the same placed state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reading lives in the person's kept record and leaves with it, on eviction, `forget` or the planning's end.
