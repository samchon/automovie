# src/architecture/builtEnvironmentSpaceConnectors.ts#builtEnvironmentSpaceConnectors

## @evidence contracts/development/implementation.md#principled-implementation

Filters the record's connectors on exact membership of the space id in each connector's stop list, preserving record order and object identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads stops through the shared `builtConnectorStops` and refuses ids through `requireBuiltSpace`, so this query owns only the filter and agrees with adjacency on what a stop is.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no connector kind or space; containment is deliberately not applied, so a root is not credited with its rooms' connectors.

## @evidence contracts/development/common.md#meaningful-documentation

States why routes come back intact, exact stop matching and what it excludes, the shared stop rule, record order, that the objects are the record's own, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the summed connector stop counts plus the space count for the id check.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Rebuilds each connector's stop list on every call instead of indexing stops by space, because the index would outlive a record the caller may edit; no work is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one stop list per connector during the scan and the returned array of record references, which the caller owns.
