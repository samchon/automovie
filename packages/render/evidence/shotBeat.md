# src/shotBeat.ts#shotBeat

## @evidence contracts/development/implementation.md#principled-implementation

Removing the fixed prefix inverts the `"shot:" + beat` construction exactly, and any other id is returned whole because no prefix was added to it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both sidecar planners map shots to beats through this one function instead of each spelling the prefix rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The prefix is the interface's shot-id contract, a defined convention rather than a special case, and no id is otherwise rewritten.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states both mappings, the contract the prefix comes from, and which planners rely on it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One prefix test and slice of a short id choose no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A prefix test per frame is cheaper than caching the mapping by shot id.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The beat id is a slice of the shot id handed back to the planner, and nothing is retained.
