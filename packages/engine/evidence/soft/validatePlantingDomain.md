# src/soft/validatePlantingDomain.ts#validatePlantingDomain

## @evidence contracts/development/implementation.md#principled-implementation

Finite scalar ranges, positive growth span and bounded depth feed the same worst-case branching/foliage budget used by growth; ratios may equal one, and finite fields alone do not guarantee every derived coordinate remains representable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One recipe owner supplies both production binding validation and lowering admission, with shared scalar/integer/vector/id helpers preserving diagnostic paths and traversal order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid values are reported rather than clamped. Direction zero uses squared components and can misclassify tiny nonzero inputs; the pass is not a universal finite-geometry or continuity certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States typed-record admission, range and budget effects, recipe-local law and remaining squared-arithmetic/derived-representability limits; malformed container shapes can still throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

C child records and depth D take O(C+D) validation/budget work plus identity storage; foliage budgeting uses the same level walk and this pass never emits the full tree.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Scalar, integer, vector and sibling-id policies are shared with soft-domain validation, while each pass owns its sets and recipe-specific limits; no mutable-recipe result cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fresh collector and child-id set are local; returned findings retain offending values, and no emitted plant, viewer handle or task is acquired.
