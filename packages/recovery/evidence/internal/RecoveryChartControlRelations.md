# src/internal/RecoveryChartControlRelations.ts#RecoveryChartControlRelations

## @evidence contracts/development/implementation.md#principled-implementation

A depth-first dependency order composes finite affine expressions over original fixed and independent controls. Folding fixed sources is an algebraic substitution; binary64 rounding remains separate from exact affine equivalence.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure operation validates ownership, resolves the dependency DAG and publishes sparse solver expressions with separate coefficient diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source geometry, identity inference, diagonal floor, epsilon pruning, negative-weight clamp, normalization or post-fit enclosure adjustment changes the supplied relations.

## @evidence contracts/development/common.md#meaningful-documentation

States original term IDs, millimetres, budget counting, zero and cycle semantics, affine diagnostics, binary64 limits and atomic failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C controls, E declared dependency terms and T=maxTerms, expansion costs O(C+E*T) before sorting, with O(C*T*log(T+1)) worst-case output sorting and O(C*T+E) retained work. Each intermediate map is checked against T and traversal depth against maxDepth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every control expression and its depth are computed once and reused by all dependent relations; repeated source IDs combine in a bounded map. There is no cross-call cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local ownership maps, traversal state and flattened expressions expire on return or throw. Outputs own their arrays; controls and explicit sparse/depth budgets bound retained data, and no handles or input arrays escape.
