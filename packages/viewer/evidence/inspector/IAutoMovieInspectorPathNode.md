# src/inspector/IAutoMovieInspectorPathNode.ts#IAutoMovieInspectorPathNode

## @evidence contracts/development/design.md#principled-representation

A path is names joined by `/`, so its prefixes form a tree; each node is one prefix, with the pattern that selects exactly that prefix and its subtree, and whether something drawn sits at that exact path or only beneath it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `buildAutoMovieInspectorPathTree` and read by the selection panel, which shows the name, edits by the pattern, and recurses into the children.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No node names a subject kind or a part; groups and objects are told apart only by `drawn`. The pattern is null where the path grammar has no pattern for exactly that node.

## @evidence contracts/development/common.md#meaningful-documentation

States what a node stands for and what each member holds.
