# src/publishAutoMovieRenderAttempt.ts#publishAutoMovieRenderAttempt

## @evidence contracts/development/common.md#meaningful-documentation

States the install order, the restore on failure, and what happens to a former controls folder without control channels.

## @evidence contracts/development/implementation.md#principled-implementation

Moves the former film and controls into staging, renames the candidates into place and installs the report last; on failure only this attempt's installed folder is removed and the former files return, so film, channels and report always come from one attempt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the installation transaction for every render output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A folder that failed to move aside is never deleted; only one this attempt installed is.

## @evidence contracts/development/implementation.md#efficient-algorithms

A constant number of renames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Former files wait in the caller's staging folder, which the caller removes.
