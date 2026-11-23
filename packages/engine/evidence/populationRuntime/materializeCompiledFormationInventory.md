# src/populationRuntime/materializeCompiledFormationInventory.ts#materializeCompiledFormationInventory

## @evidence contracts/development/implementation.md#principled-implementation

Sort formation ids in code-unit order and compile every design against the same model group, radius and terrain inputs, producing an own-property dictionary independent of author declaration order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Inventory ordering belongs here while the per-formation compiler owns geometry, terrain, summaries and digests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Object.fromEntries admits arbitrary ids as own properties without prototype mutation; no formation id changes compiler policy.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify deterministic keyed inventory, caller-supplied measurements and world terrain; each result is a compact formation record.

## @evidence contracts/development/implementation.md#efficient-algorithms

F formations cost O(F log F) ordering plus the sum of their slot/terrain compilation costs and output sizes; no claim of cost independent of member count is made.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All entries share the same read-only input maps during this call; complete compiled results are not cached across mutable design or measurement inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned dictionary and compiled snapshots; local ordering arrays disappear after completion or failure, with no background work retained.
