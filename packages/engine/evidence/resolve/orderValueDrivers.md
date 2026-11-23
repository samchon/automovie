# src/resolve/orderValueDrivers.ts#orderValueDrivers

## @evidence contracts/development/implementation.md#principled-implementation

Index producers by exact channel key, collect each driver's other producers and visit dependencies by original driver index; gray DFS nodes refuse cycles and black nodes run once. Self-input is excluded as in the existing one-step driver contract.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The channel-space resolver delegates only dependency ordering here; copy/driven evaluation and world-driver deferral stay with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every producing driver of a consumed channel is retained, including duplicate outputs; the numeric dependency sort preserves the old all-pairs scan order rather than choosing a fixture-specific winner.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify exact channel keys, self-input policy, stable DFS order, cycle refusal and borrowed driver records; the returned array is fresh and contains each driver once.

## @evidence contracts/development/implementation.md#efficient-algorithms

D drivers have at most three input/output keys each; producer indexing plus E matched dependency edges replaces unrelated all-pairs scans. Deduplication and per-driver dependency sorting cost O(D+E+sum(degree*log degree)); recursive DFS still has O(D) stack-depth limits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One producer index serves all input lookups and one DFS color array shares completed dependencies across dependents; no graph cache persists across mutable driver fields or order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Output retains D borrowed driver references; producer/dependency/color maps are call-local and no sampled channel, scene graph, handle or task survives here.
