# src/architecture/designLineageCompare.ts#designLineageCompare

## @evidence contracts/development/implementation.md#principled-implementation

Validates the lineage with `requireValidDesignLineage` and then answers with `compareDesignVariants`, whose keyed change comparison relies on unique change keys and resolvable variants, the two facts this call's validation establishes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public entry is the validation guard plus one delegation, so the pair comparison and the per-decision comparison share a single body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no lineage or variant; an invalid lineage is refused rather than compared on whatever resolves.

## @evidence contracts/development/common.md#meaningful-documentation

States the shared-subject guarantee, why different revisions are refused, the null-side meaning, both orders, what `common` lists, and every thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full lineage validation, including lifecycle reachability and decision-by-artifact fairness scans, followed by the full `compareDesignVariants` cost: variant lookups, change-key folds, subject scans and result sorts. Validation and comparison are not described by difference count alone.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one pair per call from the caller's mutable record; a caller comparing every option of a decision uses `designLineageDecisionComparisons`, which validates once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned comparison.
