# src/architecture/builtSpaceSubtree.ts#builtSpaceSubtree

## @evidence contracts/development/implementation.md#principled-implementation

A breadth-first walk over a parent-to-children index built in one pass, the standard traversal for a forest given by parent pointers; each id enters the set once, so a parent cycle in an unvalidated record terminates instead of looping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the descendant walk with subtree containment, fidelity and content queries. Building ownership follows its separate ancestor walk; this helper only owns downward parent-link reachability.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space and treats every `parent` link alike; an undeclared root is returned as itself rather than refused here, because refusal belongs to the id-addressed queries.

## @evidence contracts/development/common.md#meaningful-documentation

States that the root is included even when undeclared, that membership follows `parent` links at any depth, and that iteration order is discovery order and not a sorted population.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time and space are linear in the declared space count: one pass builds the child index and the walk visits each reachable space once, replacing a fixed-point rescan whose cost grew with depth times count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Recomputed per call from the given array; the space list is the caller's mutable record, so no cached subtree could prove it still matches.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The child index/queue are local. The caller owns the set, bounded by S declared ids plus one possibly undeclared root, rather than always S.
