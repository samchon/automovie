# src/resolve/lowerSkeletonNodes.ts#lowerSkeletonNodes

## @evidence contracts/development/implementation.md#principled-implementation

Lower admitted bones beneath a fresh identity root, prefixing bone/parent ids and borrowing rest translation/rotation; composeScene separately admits graph uniqueness and cycles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bridge joins scene lowering to motion clip naming, with the caller explicitly choosing prefix and root parent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fresh nested root records prevent one lowering's mutation from contaminating another; bone rest data stays borrowed rather than silently cloned or repaired.

## @evidence contracts/development/common.md#meaningful-documentation

Props document defaults, root placement and rest ownership; the output contains nodes rather than geometry or current motion state.

## @evidence contracts/development/implementation.md#efficient-algorithms

B bones require O(B) new node wrappers and id text, with fixed-size transforms and one root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Scene/motion consumers share naming; changed mutable skeleton contents require new lowering instead of an identity-only cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns node/root records and the skeleton owns borrowed rest data; no native node, handle or task is retained.
