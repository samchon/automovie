# src/architecture/builtElementRestMatrices.ts#builtElementRestMatrices

## @evidence contracts/development/implementation.md#principled-implementation

Memoizes column-major affine products of local TRS matrices. Products preserve composed shear rather than certifying representable world TRS; non-finite arithmetic is not refused here. A visiting set terminates parent cycles with null, while an excessively deep acyclic chain can still exceed the runtime call stack.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The rest-pose, failure-tolerant counterpart of `builtEnvironmentWorldMatrices`, kept separate because prop placement needs rest poses and `null` answers on unvalidated records where staging needs operated poses and validated input; it replaces a private copy in each prop query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element or opening; a missing or cyclic ancestor is answered by the stated `null` rule rather than caught from a throw, and operating states are ignored for every element alike.

## @evidence contracts/development/common.md#meaningful-documentation

States the composition order and matrix layout, that operating states are ignored and why, each `null` case, why it tolerates unvalidated records and how that differs from the operated-pose staging, the first-declaration rule for a duplicate id, and the memoization's lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(E + Q) across index construction and Q lookups, with at most O(E) matrix products and parent-link visits. Missing-id requests still cost lookups; recursion depth follows hierarchy depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one lookup every ancestor's matrix is computed once and reused by all its descendants and by every later request; across lookups nothing is shared, because the record is the caller's mutable data.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the id index and the memo for as long as the caller holds the lookup, bounded by one entry and one sixteen-number matrix per element, and both are released when the lookup is dropped.
