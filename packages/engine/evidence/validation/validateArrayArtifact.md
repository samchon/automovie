# src/validation/validateArrayArtifact.ts#validateArrayArtifact

## @evidence contracts/development/implementation.md#principled-implementation

Require Array.isArray and append a type fault for every other top-level shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This shallow gate separates list shape from the element validators.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Array length, density and element schemas are not admitted by this predicate.

## @evidence contracts/development/common.md#meaningful-documentation

The boolean return permits callers to stop before list-specific dereferences.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shape test uses constant work apart from diagnostic text.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Clip and shot gates share the same boundary, then validate their own elements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The list is borrowed and only caller-owned diagnostics escape.
