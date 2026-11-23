# src/film/scriptAncestors.ts#scriptAncestors

## @evidence contracts/development/implementation.md#principled-implementation

Follows parent links from an id index and tracks visited ids, the standard way to walk a parent-pointer tree while proving termination, so a cycle is reported at the first repeated id rather than looping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk returning plain ids, which is all the cascade needs to address a level; validation of the whole tree stays in `validateScriptTree`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No node kind or depth is special-cased, and a malformed chain throws instead of returning the prefix that was found.

## @evidence contracts/development/common.md#meaningful-documentation

States the order and exclusion with an example, why the chain exists, the precondition, every throw, and which node wins a repeated id.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) to index the N nodes, then O(D) for a chain of depth D with constant-time lookups; the index is rebuilt per call because the tree is passed as a plain array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one node per call; the tree carries no identity or version to key a reusable index on.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The index and the visited set are released on return; the returned chain holds at most the tree's node count of ids.
