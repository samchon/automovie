# src/screenplay/renderScreenplay.ts#renderScreenplay

## @evidence contracts/development/implementation.md#principled-implementation

A validated script tree is walked depth-first in declared child order; treeless scripts use flat beat order, and the tree intent supplies the header. Tree admission and cycle checks belong to script commit, not this serializer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Tree and flat serialization remain private branches of one screenplay renderer, while scene slug spelling is shared with caption labels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty beat populations refuse instead of emitting an empty screenplay; no authored node id or dialogue text selects a special serialization path.

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies tree ownership, fallback behavior, indentation, anchored seconds and terminal newline; author-supplied text is emitted without semantic rewriting.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N tree nodes, B beats and L output characters, beat and child maps plus traversal cost O(N+B+L) with O(N+B+L) retained construction data; recursion uses the tree depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One child index and one beat-name index serve the complete document walk; no header, beat or scene is re-indexed for each descendant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Maps, line arrays and recursion state are local to the serialization, and only the resulting screenplay string escapes with no file or renderer handle.
