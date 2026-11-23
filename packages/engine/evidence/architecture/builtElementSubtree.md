# src/architecture/builtElementSubtree.ts#builtElementSubtree

## @evidence contracts/development/implementation.md#principled-implementation

A breadth-first walk over a parent-to-children index built in one pass, the standard traversal of a forest given by parent pointers; the visited set makes it total on cyclic input.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The element counterpart of `builtSpaceSubtree`, shared by the opening and connector operation checks and the staged-configuration check, which previously each rescanned every element until nothing changed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element or kind is special-cased, and undeclared roots are returned rather than refused because refusal belongs to the caller that resolved them.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states that roots are included even when undeclared, the cycle behavior, and the iteration order.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(E + R) for E element records and R supplied roots: builds the child index, inserts roots and visits each reachable child id once, without depth-times-record rescans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per call from the given array, because the element list is the caller's record and callers ask from different roots.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The child index and queue are released on return; the caller owns the returned set, bounded by the element count plus the undeclared roots.
