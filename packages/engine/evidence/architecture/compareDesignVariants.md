# src/architecture/compareDesignVariants.ts#compareDesignVariants

## @evidence contracts/development/implementation.md#principled-implementation

Each side's changes are keyed by the injective `designLineageRecord` of subject and aspect, the union of keys is compared value by value, and only differing values are reported; sorting by code unit makes the order a function of the ids alone. The premise is a validated lineage, which the two public callers establish first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The comparison body lives once here, without validation, so the single-pair and per-decision queries share it and each validates exactly once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no lineage, variant or subject; different base revisions are refused because a comparison across them would mix the schemes with the revision's own changes.

## @evidence contracts/development/common.md#meaningful-documentation

States the validity premise and what a duplicate key would do, every refusal, the null-side meaning, both orders, and what `common` lists.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two O(V) variant lookups, O(C) change indexing/comparison, O(S) subject filtering and sorting D differences/U untouched subjects: O(V + C + S + D log D + U log U), treating string-key work separately from fixed-size scalar operations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Compares one pair per call; validation, the expensive shared step, is done once by the caller and not repeated here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the two keyed change maps only for the call; the caller owns the returned comparison.
