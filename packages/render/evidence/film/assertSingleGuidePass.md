# src/film/assertSingleGuidePass.ts#assertSingleGuidePass

## @evidence contracts/development/implementation.md#principled-implementation

Membership is decided by `isGuidePass` over the runtime list that mirrors the `AutoMovieGuidePass` union, minus `beauty`, and repeats fold into a list of distinct passes whose length must be one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function returns the single pass the planner keys a chunk by instead of a one-element list, and it reuses the shared pass list rather than restating it; it stays apart from `normalizeGuidePasses` because the two admission rules differ.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pass or deliverable is special-cased; the runtime membership check covers values that reached the typed parameter from untyped JSON, and each refusal throws rather than picking a pass.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states what is returned, both refusals, the reason a deliverable owns one pass, and how this rule differs from `normalizeGuidePasses`.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the P entries with two scans of at most six known passes each, O(P) time, and a distinct list of at most five entries; every entry must be read to prove there is one distinct pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The planner calls it once for the legacy default and once per declared guide deliverable on one-element lists, so there is no repeated work worth sharing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The distinct list of at most five passes is local and dropped on return, leaving only the returned pass literal; no handle or task is involved.
