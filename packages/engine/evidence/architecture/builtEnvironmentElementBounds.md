# src/architecture/builtEnvironmentElementBounds.ts#builtEnvironmentElementBounds

## @evidence contracts/development/implementation.md#principled-implementation

The union of an element's part boxes is the binary64 box of its measured static CPU vertices, so the answer is read from the part query rather than measured a second way.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the part query with the shared box union, so element staging, tessellation and the null rules each have one owner and this query adds only the union.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element or caller; both `null` readings and the origin fallback are the part query's stated rules, passed through unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States who reads this query, the operating state and vertices measured, both `null` readings and why they are not refusals, the origin fallback, and the whole-hierarchy cost per call with the batch alternative.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the part query's element/model scans, full world staging, procedural tessellation and vertex fold, then O(P) to union its P part boxes. Its cost is not solely element count plus vertex count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one element over the caller's mutable record and caches nothing; building-wide reuse is `builtEnvironmentPartBoxes`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing after returning; the caller owns the one returned box.
