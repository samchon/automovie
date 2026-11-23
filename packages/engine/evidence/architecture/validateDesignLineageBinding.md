# src/architecture/validateDesignLineageBinding.ts#validateDesignLineageBinding

## @evidence contracts/development/implementation.md#principled-implementation

Set membership by exact string equality is the whole question, since a host identity either is or is not published; the direction of the check follows from lineage being an additive annotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept apart from `validateDesignLineage` because the published id list belongs to the caller's host graphs, which this function names none of, so any graph that publishes ids can bind a lineage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No graph or id is special-cased, and unannotated host ids are allowed by the additive contract rather than tolerated for a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why binding is separate, what is and is not an error, the exact comparison, the paths, that nothing throws, and which function checks self-consistency.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K + S + D) for K known ids, S subjects and D derived artifacts: one set build and one lookup per lineage id.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one lineage against one id list per call that coordinates no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The published-id set is local and released on return, bounded by the known-id count; the returned validation holds the findings.
