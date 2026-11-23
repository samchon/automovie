# src/core/resolveArchetypeSpanParts.ts#resolveArchetypeSpanParts

## @evidence contracts/development/common.md#meaningful-documentation

Defines dependency order, same-pose endpoint lookup, original declaration ordering, rigid cylinder ownership and unsupported cycles.

## @evidence contracts/development/implementation.md#principled-implementation

Kahn's topological traversal resolves a line only after every line carrying one of its endpoints. The shared endpoint reader sees an array whose predecessor cylinders already have their current transforms and lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index declarations and parts, derive dependency counts, resolve each ready line once, and refuse any remaining cycle before returning states in the original order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No declaration-order guess, stale predecessor frame, missing line part or recursive cycle substitutes for a physical attachment. The injected reader is the existing shared state operation, avoiding a runtime module cycle and duplicate endpoint arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Graph/index work is O(P+S); shared endpoint lookup remains O(S(P+A)) for parts, spans and contacts. O(P+S) call-local storage and an iterative queue avoid unbounded recursion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each predecessor geometry and endpoint state is computed once and shared by its dependents and the held-frame emission operation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one new parts array and S states, sharing unchanged records; maps and queue are released after the call, with no retained model, sample cache or external resource.
