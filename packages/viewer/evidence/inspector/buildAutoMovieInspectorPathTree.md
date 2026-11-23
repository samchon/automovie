# src/inspector/buildAutoMovieInspectorPathTree.ts#buildAutoMovieInspectorPathTree

## @evidence contracts/development/common.md#meaningful-documentation

States what becomes a node, the order, what a repeated path does, the empty path and each node's pattern rule by reference to the node type.

## @evidence contracts/development/implementation.md#principled-implementation

A path is split on `/` as the path grammar splits it, so a node's prefix is a path the grammar can name; an anchored pattern (one holding `/`) selects that prefix and its subtree, which is why a top-level name is written `<name>/**`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk per path down a map from prefix to node, creating what is missing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No name is treated specially; a name holding a wildcard character stays a wildcard in its pattern, because the grammar has no escape.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hashed lookup per name of every path; each lookup key is the prefix built by appending one name, so the cost is the total length of the prefixes, which for paths a few names deep is a small multiple of their own length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one list.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh tree and keeps nothing.
