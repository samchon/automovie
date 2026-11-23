# src/index.ts#RecoveryChartCollar

## @evidence contracts/development/implementation.md#principled-implementation

Min/max cuts stay before each first and after each last side knot. Four corners, four independently partitioned bands and one center cover the square with disjoint interiors; each strict interior split preserves that partition inductively.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This pure helper owns only normalized parameter rectangles and explicit caller-requested splits, leaving physical relations, fitting and retained-best fallback to consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source mesh, coordinate weld, epsilon deletion, knot relocation or anatomy-specific policy enters the construction; all supplied side intervals survive.

## @evidence contracts/development/common.md#meaningful-documentation

States side and bounds ordering, deterministic IDs, global split coordinates, initial count scope, thin-span limits, input ownership and failure effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

K side knots produce O(K) initial work and storage; S explicit splits use expected O(S) map work and O(K+S) returned leaves, bounded by maxLeaves. Coverage follows the construction and does not require a quadratic overlap scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Side cuts are collected once, and the leaf map resolves each sequential split without searching or rebuilding unrelated roots. There is no cross-call cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One call owns knot-derived cut arrays and at most maxLeaves leaf records. Temporary maps expire on return or throw; returned bounds are newly owned arrays and inputs are never retained or mutated.
