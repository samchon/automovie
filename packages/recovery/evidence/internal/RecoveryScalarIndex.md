# src/internal/RecoveryScalarIndex.ts#RecoveryScalarIndex.create

## @evidence contracts/development/implementation.md#principled-implementation

Each triangle's exact binary64 minimum and maximum define necessary and sufficient scalar intersection tests. Tree bounds only reject subtrees that cannot satisfy those same comparisons.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The returned closure hides copied interval data; consumers receive only transient source face candidates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Flat and tangent faces remain in inclusive plane queries, and every component with open-slab overlap remains in slab queries. No curve fitting or surface generation occurs here.

## @evidence contracts/development/common.md#meaningful-documentation

States source immutability, inclusive versus strict boundaries and stable output ordering.

## @evidence contracts/development/implementation.md#efficient-algorithms

For T faces and V heights, preparation costs O(V+T log T) time and O(T) retained storage. A query visits intersecting tree bounds and sorts A matches in O(A log A); worst case O(T+A log A), while disjoint subtrees are skipped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Copied face intervals and tree bounds are reused by every plane and slab in one extraction. The caller creates a new index for another mesh or scalar chart; no mutable-input cache exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The extraction call owns O(T) interval/tree arrays and each query's O(A+log T) result/stack. These become unreachable after extraction; original source positions and topology never escape through query results.
