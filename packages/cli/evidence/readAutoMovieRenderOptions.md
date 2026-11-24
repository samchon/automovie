# src/readAutoMovieRenderOptions.ts#readAutoMovieRenderOptions

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates the command's options with their meaning and absent value, says where the rest go and which of them a render admits, and states every refusal, including a background other than `scene` or `transparent`.

## @evidence contracts/development/implementation.md#principled-implementation

The command's keys are removed before the request is read, as `capture` and `inspect` do, so the subject has one name and one reader in every host.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the listed options that takes them out, then the checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No module is guessed from the folder.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the options.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per command.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and keeps nothing.
