# src/internal/inspectExternalModelHierarchy.ts#inspectExternalModelHierarchy

## @evidence contracts/development/implementation.md#principled-implementation

Index-validated child edges fill one parent table; iterative three-state walks detect cycles and mark completed root paths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Hierarchy admission runs before profile dispatch so static, humanoid and motion consumers share one forest contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicate children, multiple parents and parent cycles throw without rewriting the graph or dropping links.

## @evidence contracts/development/common.md#meaningful-documentation

Comments explain index-validation prerequisite, unique parent semantics and depth-safe iterative traversal.

## @evidence contracts/development/implementation.md#efficient-algorithms

N nodes and E child links cost O(N+E), since completed parent walks are marked and each node enters one unfinished path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned parent table is reused by scene-root admission and motion-node interpretation in the same inspector call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Parent/state/path arrays are bounded by node count; only the returned table remains with its synchronous caller.
