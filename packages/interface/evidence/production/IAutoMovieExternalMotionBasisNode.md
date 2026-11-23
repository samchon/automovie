# src/production/IAutoMovieExternalMotionBasisNode.ts#IAutoMovieExternalMotionBasisNode

## @evidence contracts/development/design.md#principled-representation

Original glTF node index and inspector-issued id retain source identity independently of optional display names; parent links and parent-local rest transforms preserve the hierarchy that semantic mapping must reconcile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source index, stable id, optional name, parent id and rest transform separate machine addressing from human labels without embedding target bone assumptions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unnamed nodes remain addressable by inspected identity, and fuzzy source-name matching cannot invent parentage or rest transforms absent from the bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Defines zero-based source index, normalized channel identity, nullable authored name and parent, and normalized parent-local rest placement.
