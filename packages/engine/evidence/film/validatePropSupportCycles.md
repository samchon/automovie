# src/film/validatePropSupportCycles.ts#validatePropSupportCycles

## @evidence contracts/development/implementation.md#principled-implementation

Depth-first search over the contact graph with an on-stack set and a finished set, the standard back-edge test for a directed cycle, so a relation reaching a prop still on the stack closes a cycle and finished props are never re-entered.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One graph check apart from the registry and geometry gates, indexing only the uniquely declared nodes it can follow, so `validatePropPlacements` composes it as one line.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ambiguous, missing and self-citing targets are skipped because another rule names them, not to hide a cycle, and no prop or affordance is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States which props and relations take part, why the others are skipped, where and how often a cycle is reported, and the visiting order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in props plus all relations of uniquely declared props: each such prop is entered once and each relation is inspected once, following only prop-affordance targets, with constant-time set and map lookups; recursion depth is bounded by the longest contact chain.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One search per validation call; nothing is kept across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the node index and the two sets die with the call.
