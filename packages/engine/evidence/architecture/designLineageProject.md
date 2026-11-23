# src/architecture/designLineageProject.ts#designLineageProject

## @evidence contracts/development/implementation.md#principled-implementation

Presence comes from `designLineagePhaseSnapshot` and is indexed by subject id, so each record is kept exactly when its subject is `present` or undeclared; the premise is that a record's `id` is the lineage subject id it stands for.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A generic filter over `{ id }` records that reuses the snapshot's presence answer, so no consumer recomputes what stands at a phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no record or subject; undeclared ids pass through by the stated contract so a partial plan cannot empty a production, and the documentation states that no compiled consumer is wired to this yet.

## @evidence contracts/development/common.md#meaningful-documentation

States the generic mechanism, its unmet wiring, the pass-through rule and where typos are caught, order and identity preservation, which presences are dropped, the null-phase meaning, and the inherited refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the full `designLineagePhaseSnapshot` cost, including lineage validation, phase reachability and lifecycle sorting, then O(L + N) for an L-lifecycle presence index and N input records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Projects one record list per call from the caller's mutable lineage; nothing is cached across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the snapshot and index only for the call; the returned array is new but shares the input record objects.
