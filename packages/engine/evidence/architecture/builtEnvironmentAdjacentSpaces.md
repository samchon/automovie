# src/architecture/builtEnvironmentAdjacentSpaces.ts#builtEnvironmentAdjacentSpaces

## @evidence contracts/development/implementation.md#principled-implementation

Collects the other sides of every boundary listing the space and the reachable stops of every connector serving it into an insertion-ordered `Set`, so each neighbour appears once in discovery order; reachability is any other stop for a bidirectional run and only later stops for a one-way run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads stops through the shared `builtConnectorStops` and refuses ids through `requireBuiltSpace`, so this query owns only the adjacency rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space or connector kind; a closed partition counts as adjacency by the stated rule rather than by inspecting openings, and a run that lists the space twice, which validation refuses, is not repaired here.

## @evidence contracts/development/common.md#meaningful-documentation

States the multi-stop and one-way rules, that a closed boundary still joins, exact matching rather than containment, the uniqueness and discovery order of the ids, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S + B + C + T) for S spaces in the id lookup, B boundaries, C connectors and T summed boundary sides and connector stops, assuming constant-time set access. Empty side/stop lists still pay one iteration per owning record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one space per call over the caller's mutable record; a caller asking many spaces owns any index it builds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing after returning; the caller owns the returned ids, bounded by the space count.
