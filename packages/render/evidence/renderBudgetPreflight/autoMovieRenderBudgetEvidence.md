# src/index.ts#autoMovieRenderBudgetEvidence

## @evidence contracts/development/implementation.md#principled-implementation

Sorted shot verdicts and deduplicated sorted declared tiers determine the worst status; structured JSON encoding distinguishes arbitrary string field contents before hashing, avoiding delimiter aliases.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This reducer owns the tier-level envelope while selectAutoMovieRenderBudget owns tier lookup and individual assessments own measurement. Current callers are tests and internal budget helpers; no automatic production publication or render-job gate is wired here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty shot set reports not-run, and incomplete or over verdicts retain their own status; no absent report is interpreted as clearance.

## @evidence contracts/development/common.md#meaningful-documentation

The comment lists the exact digest denominator and caller obligations for selected-budget assessment and unique shot ids; evidence members define ordering, severity and the empty-population outcome.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S assessments and B budgets, sorting costs O(S log S+B log B), reduction and serialization are linear, and retained output holds S assessment references and B tier strings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing assessment reports and targets are referenced rather than recomputed; canonical ordering permits callers to reuse byte-identical evidence for equivalent verdict inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The output retains the sorted assessment array and tier list; sorting copies the input array and opens no file, encoder or renderer resource.
