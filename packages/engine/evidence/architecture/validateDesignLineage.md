# src/architecture/validateDesignLineage.ts#validateDesignLineage

## @evidence contracts/development/implementation.md#principled-implementation

Treats the lineage as id-keyed graphs: references resolve through declared id sets, the revision, phase and derivation graphs are checked for cycles with a depth-first walk, and removal order is decided by the transitive prerequisites of the removing phase, computed by breadth-first search.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The lineage owns its subject, revision, phase, lifecycle, variant and decision rules; the derived-artifact rules live in `validateDesignLineageDerived`, and id declaration, reference resolution, cycle detection and blank strings come from the shared validation helpers instead of private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject, phase or variant is special-cased; a missing lifecycle is refused rather than defaulted, and a dangling prerequisite is reported once on its own path rather than repeated as an ordering complaint.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every refusal class and why staleness refuses, how to rebake, why lifecycle coverage is total, the fairness rule, the digest form, the path root, that nothing throws, and which function checks host identities.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds id/variant/phase indexes and scans declared records/references. Each lifecycle with removal adds a prerequisite walk costing O(P + R) over P phases and R requirements. Also pays the full `validateDesignLineageDerived` cost, including decision-by-artifact fairness comparisons; total cost is not generally linear.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A validation of one record per call; every lineage query validates its input once before answering, and nothing here is shared across those calls because the record is the caller's mutable value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id sets, the phase and variant indexes and each prerequisite walk are local and released on return, each bounded by its record count; the returned validation holds the findings.
