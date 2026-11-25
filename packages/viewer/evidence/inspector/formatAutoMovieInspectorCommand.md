# src/inspector/formatAutoMovieInspectorCommand.ts#formatAutoMovieInspectorCommand

## @evidence contracts/development/common.md#meaningful-documentation

States the option form and why it is used for every option, the round trip through the command's reader, the host's prefix responsibility, the selected shell and the request-only default.

## @evidence contracts/development/implementation.md#principled-implementation

The request writer decides keys and values and the command reader is the inverse of the `--key=value` form. POSIX quotes an apostrophe by closing, escaping and reopening the word. PowerShell doubles single quote characters and quotes commas so scripts receive the list as one argument. PowerShell 7.3 or later with standard native argument passing preserves literal double quotes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map to request options and one command join with the selected shell quoting the host and request tokens.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Request options come from the writer used for the address. The caller supplies host options when its capture entry requires them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the total text length of the written request and the host prefix.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh strings and keeps nothing.
