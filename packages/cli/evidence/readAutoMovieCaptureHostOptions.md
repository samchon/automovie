# src/index.ts#readAutoMovieCaptureHostOptions

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates the host's options with their meaning and absent value, says where the rest go, and states every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The host's keys are removed before the request is read, so the request grammar stays one grammar for the address, the command and props, and a host key cannot be mistaken for a request key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the listed options that takes the host's keys out, then the checks; the list is the one the README test reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject module is guessed from the folder: a capture names what it draws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the options.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per command.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh map and keeps nothing.
