# src/architecture/designLineageImpact.ts#designLineageImpact

## @evidence contracts/development/implementation.md#principled-implementation

Breadth-first reachability from the changed ids over the reversed `inputs` edges, visiting each identity once, so the invalidated set is exactly the derived artifacts with a dependency path to a change; validation guarantees every edge endpoint is declared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One dependents index and one walk, with the validation guard shared by every lineage query, so the answer and its complement come from the same traversal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no identity or artifact kind; an undeclared changed id is refused rather than silently ignored, because a typo would otherwise report nothing invalidated.

## @evidence contracts/development/common.md#meaningful-documentation

States the backward walk and an example chain, why the complement is returned, that a changed artifact counts itself, the dedup and order of all three lists, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full lineage validation, including lifecycle prerequisite walks and decision-by-artifact fairness scans, then O(I + R + C) indexing and traversal for identities I, derivation edges R and changed inputs C. The three deduplicated output lists add their sorting costs; queue reads use an index rather than shifting.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one change set per call from the caller's mutable record; the index is rebuilt each call because a cached one could not prove the lineage unchanged.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The index, queue and visited set live only for the call and are linear in the lineage size; the caller owns the returned lists.
