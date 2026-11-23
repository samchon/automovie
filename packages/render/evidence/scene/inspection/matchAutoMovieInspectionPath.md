# src/index.ts#matchAutoMovieInspectionPath

## @evidence contracts/development/common.md#meaningful-documentation

States what a path is, the two wildcards, the anchoring rule for each pattern form, that a match takes the subtree, and gives examples of both forms.

## @evidence contracts/development/implementation.md#principled-implementation

Both forms reduce to one segment-glob match: a name-only pattern is `**`, the name, `**`, and an anchored pattern is its segments followed by `**`, so the subtree rule is the trailing `**` in both.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Normalize the pattern into segments, then one table over path names and pattern segments filled from the end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names are compared whole or through an escaped expression built from the segment, so a dot or a bracket in a name is a literal character; no name or prefix is treated specially.

## @evidence contracts/development/implementation.md#efficient-algorithms

The table costs names times segments boolean cells, where backtracking over several `**` would be exponential.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each segment's expression is built once per call and reused for every name it is tried against.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The table and the expressions are local to one call and nothing is kept.
