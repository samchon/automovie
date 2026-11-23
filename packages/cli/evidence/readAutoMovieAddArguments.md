# src/index.ts#readAutoMovieAddArguments

## @evidence contracts/development/implementation.md#principled-implementation

The directory segment passes the same portable-segment rule as a project name and must equal its trimmed form, so no separator, `.`, `..` or padding reaches the joined path.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The add grammar is separate from create; the template owns the segment rule and `run` owns the workspace path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No family is inferred from the name and no workspace is searched for; the family is typed explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the grammar, the family pair, the segment rule and why it matters, and what throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan over the tokens and one split of the target.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure parser owns no cross-request effect to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Local strings and arrays expire after return and no handle is acquired.
