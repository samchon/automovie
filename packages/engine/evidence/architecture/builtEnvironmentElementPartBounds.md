# src/architecture/builtEnvironmentElementPartBounds.ts#builtEnvironmentElementPartBounds

## @evidence contracts/development/implementation.md#principled-implementation

Reads the element's world matrix from the shared current-state staging and folds each part's transformed vertices into its binary64 axis-aligned box through `builtPlacedPartBoxes` under the stated static CPU premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A lookup of the element and its model followed by the two shared measuring helpers, so this query owns only the per-element null rules and none of the staging or tessellation code.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element or model; the null answers and the origin fallback are stated rules that the union query and the overlap and support queries share rather than special cases for one caller.

## @evidence contracts/development/common.md#meaningful-documentation

States why part boxes differ from the union, the containment that makes them safe to test, both null cases, the world frame, the part order, the operating state used, the origin fallback, and the whole-hierarchy cost per call.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(E + M + W + P + V) for the element and model scans, world staging cost W, model parts P and their vertices V, including tessellation cost for procedural parts. The batch query shares staging and a model index when many elements are measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one element per call over the caller's mutable record and keeps no staging between calls; building-wide reuse is `builtEnvironmentPartBoxes`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The staged matrices are dropped on return; the caller owns the returned boxes, one per drawn part.
