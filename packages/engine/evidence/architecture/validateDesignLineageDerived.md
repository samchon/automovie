# src/architecture/validateDesignLineageDerived.ts#validateDesignLineageDerived

## @evidence contracts/development/implementation.md#principled-implementation

Checks the current head, agreement with upstream artifact stamps and current digest citations for imported subject inputs, then uses the shared graph-cycle check. These recorded identities are the freshness evidence: output bytes are not recomputed, and changing an upstream artifact digest without changing its stamp is not detected here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The derived half of `validateDesignLineage`, separated so the lineage validator stays within one file's size, receiving the id sets and variant index that validator already built instead of recomputing them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No artifact kind, revision or subject is special-cased; staleness is refused rather than warned, and a comparison mismatch is refused rather than normalized.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation lists every identity, freshness, citation and fairness rule, the path root, the reporting order, and that nothing throws, and each parameter states what it supplies.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans subjects, artifacts, input links, citations and decision options through maps/sets, adds the shared derivation-cycle traversal and O(D·A) fairness comparisons for D decisions and A artifacts. No bound on decision count is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per lineage validation and fed the caller's id sets and variant index, so no work is repeated or shared across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The artifact index, subject digest map, per-artifact citation sets and per-decision kind tables are local and released on return, each bounded by its record count; findings go to the caller's collector.
