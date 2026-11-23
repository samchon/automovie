# src/index.ts#AutoMovieInspectorSelectionPanel

## @evidence contracts/development/common.md#meaningful-documentation

States the header, what each control edits, when a node is checked, what happens to typed patterns and the empty path, and how folding and the filter work.

## @evidence contracts/development/implementation.md#principled-implementation

The tree and each node's pattern come from `buildAutoMovieInspectorPathTree`, and every edit is a reducer action through the grammar, so the panel restates no path rule; folding is the disclosure pattern, a button with `aria-expanded` that owns no other control.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One memoized tree, one filter, and one recursive row per node.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A checked state is read from the request, never kept in the panel; the filter hides rows and changes no request.

## @evidence contracts/development/implementation.md#efficient-algorithms

The tree is rebuilt only when the path list changes; a render is linear in the nodes times the lists' lengths, and a folded subtree is not rendered.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `useMemo` keeps the tree while the path list is the same array, which the mount reports once per instance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the memoized tree and the filter text only while mounted.
