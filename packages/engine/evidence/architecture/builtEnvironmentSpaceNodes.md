# src/architecture/builtEnvironmentSpaceNodes.ts#builtEnvironmentSpaceNodes

## @evidence contracts/development/implementation.md#principled-implementation

A membership filter over the authored `space` fields against the subtree `builtSpaceSubtree` folds, emitting the same id spellings lowering and the render inventory use; the premise is a validated record whose space ids are unique.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The id lookup and the subtree fold are the shared `requireBuiltSpace` and `builtSpaceSubtree`, so this query owns only which records count as staged and how each is named.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space, element or population; a population is named once by its owner id because that is the contract's id for a compact set, not to shorten a particular answer.

## @evidence contracts/development/common.md#meaningful-documentation

States both id spellings and why a population is not expanded, the member id forms a caller regenerates, the membership rule, the omitted transform-only elements, the order, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the space, element and population counts: one subtree walk and one filtered pass per record list, with a set lookup per record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one space per call from the caller's mutable record, so nothing staged by an earlier call is kept to be shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the subtree set only for the call; the caller owns the returned id list.
