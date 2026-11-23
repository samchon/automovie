# src/film/normalizeGrammarShot.ts#normalizeGrammarShot

## @evidence contracts/development/implementation.md#principled-implementation

Each component is read by name, `x`, `y`, `z` and `w`, so a missing component is refused as non-finite rather than skipped as an absent key would be by `Object.entries`; subjects are sorted with the locale-independent `compareCodeUnits`, and the axis is stored as an unordered pair by the same comparison, so producer order cannot reach any finding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation and canonical ordering of one shot live together because the duplicate-id test and the index are the same pass; `readFilmGrammar` only inspects already-normalized shots and owns the cross-shot checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot, subject or intent is special-cased, nothing is clamped or defaulted except an absent `styleIntent`, which the observation documents as none, and the first defect throws instead of being repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States the throw condition of every field in check order, what the result canonicalizes, and that camera and subject objects are shared with the input.

## @evidence contracts/development/implementation.md#efficient-algorithms

Subject ordering takes O(N log N) comparisons plus compared id lengths; validation and indexing visit N subjects and S supplied style intents plus inspected text. The typed style union is finite, but this function does not enforce membership or a host-array length bound before processing it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure transform of one observation; reuse of its output across the read's checks is answered on `readFilmGrammar`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one sorted subject array, one map with an entry per subject and one intent array, all owned by the returned record; nothing is retained after return.
