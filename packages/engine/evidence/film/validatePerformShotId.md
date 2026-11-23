# src/film/validatePerformShotId.ts#validatePerformShotId

## @evidence contracts/development/implementation.md#principled-implementation

A type guard followed by the collector's own blank-string rule, so an id is valid exactly when it is a string with a non-whitespace character, the contract every id-bearing artifact field states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The blank test is `ViolationCollector.nonEmpty`, shared with every other validator; this function adds only the string guard an untyped performance input needs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every id field goes through the same two checks with its own path and label; no id is exempted or trimmed in place.

## @evidence contracts/development/common.md#meaningful-documentation

States why the value is untyped, both violation kinds with their messages, that a valid id adds nothing, and which ids are checked.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the id's length for the one trim, constant otherwise.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One check of one value per call with no shared state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Pushes at most one violation into the caller's collector and keeps nothing itself.
