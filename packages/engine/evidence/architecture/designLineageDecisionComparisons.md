# src/architecture/designLineageDecisionComparisons.ts#designLineageDecisionComparisons

## @evidence contracts/development/implementation.md#principled-implementation

Enumerates the unordered pairs of the code-unit-sorted options with `i < j`, so every pair appears once with the lower id on the left, and answers each with `compareDesignVariants` on the lineage validated once up front.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the pair comparison body with `designLineageCompare` through `compareDesignVariants`, and owns only the decision lookup and the pair enumeration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no decision or option; a settled decision is compared like an open one because the contract keeps rejected schemes on the record.

## @evidence contracts/development/common.md#meaningful-documentation

States the pair order and side rule, why settled decisions are included, the single validation, the pair count, and every thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full lineage validation once, a decision-list lookup and O(k log k) option sorting, then k(k-1)/2 full `compareDesignVariants` calls. Each call includes variant lookup, changes, subject scans and result sorts; pair count alone omits that work. Validation includes lifecycle reachability and decision-by-artifact fairness scans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one validation result is shared by every pair of the decision, because each pair reads the same unmodified lineage within one synchronous call; nothing is reused across calls, since the caller may change the record between them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the sorted option list only for the call; the caller owns the returned comparisons.
