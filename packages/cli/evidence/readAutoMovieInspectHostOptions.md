# src/readAutoMovieInspectHostOptions.ts#readAutoMovieInspectHostOptions

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates the command's options with their meaning and absent value, says where the rest go, and states every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The command's keys are removed before the request is read, as the capture command does, so the address and the command line share one grammar and a command key cannot be mistaken for a request key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass that takes the command's keys out, then the checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No module is guessed from the folder: the page shows what the command names.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the options.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per command.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh map and keeps nothing.
