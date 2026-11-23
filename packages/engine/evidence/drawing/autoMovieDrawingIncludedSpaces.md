# src/drawing/autoMovieDrawingIncludedSpaces.ts#autoMovieDrawingIncludedSpaces

## @evidence contracts/development/implementation.md#principled-implementation

A breadth-first walk down a parent-to-children index from the named spaces, which reaches exactly the descendants because validation makes the space hierarchy a forest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the meaning of the view's space filter, and the drafter, the sectioner and the opening pass all read its one set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No space or kind is special-cased; an undeclared filter name is kept and reported by the caller rather than silently dropped.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states what an empty filter means, the descendant rule and why, what happens to an undeclared name, and the hierarchy premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the children index in one pass and visits each included space once, so time is linear in the space count, where a repeated fixpoint scan would be quadratic in the hierarchy depth.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per derivation; the set it returns is shared by every stage of that derivation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The children index and queue are released on return, and the caller owns the returned set, bounded by the space count plus the filter's names.
