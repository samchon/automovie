# src/index.ts#formatAutoMovieInspectorCommand

## @evidence contracts/development/common.md#meaningful-documentation

States the option form and why it is used for every option, the round trip through the command's reader, the text's prefix and the quoting rule.

## @evidence contracts/development/implementation.md#principled-implementation

The grammar's writer decides keys and values and the command's own argument reader is the inverse of the `--key=value` form; a single-quoted POSIX word is literal except for `'`, which is closed, escaped and reopened.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map to options and one join with quoting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No option is written by hand, so the command offers exactly what the address carries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the length of the written request.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh strings and keeps nothing.
