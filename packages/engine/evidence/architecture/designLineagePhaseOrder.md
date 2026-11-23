# src/architecture/designLineagePhaseOrder.ts#designLineagePhaseOrder

## @evidence contracts/development/implementation.md#principled-implementation

Kahn's topological sort with the ready set kept in code-unit order, so each step takes the lowest-id phase whose prerequisites are emitted, which is the unique lexicographically smallest topological order; validation guarantees the graph is acyclic and every prerequisite resolves, so every phase is emitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One in-degree table, one dependents index and one ordered ready list, behind the validation guard shared by every lineage query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no phase; ties are broken by id for every plan, and an invalid plan is refused rather than partly ordered.

## @evidence contracts/development/common.md#meaningful-documentation

States why authoring order is ignored, the exact tie rule, that every phase appears once after its prerequisites, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full lineage validation first, including per-lifecycle prerequisite reachability and decision-by-artifact fairness scans. Ordering itself is O(R + P²) for P phases and R prerequisite edges: initial sorting is O(P log P), every edge is relaxed once, and ready-list insertion and removal can shift O(P) entries each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Orders the plan it is handed each call; nothing is cached because the caller may change the lineage between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The indices and ready list live only for the call and are linear in the plan size; the caller owns the returned order.
