# src/selectAutoMovieProjectName.ts#selectAutoMovieProjectName

## @evidence contracts/development/implementation.md#principled-implementation

Both paths are resolved before comparison, so `.`, `./` and the absolute working directory are the same target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pure decision is separate from the terminal prompt, so `run` owns the only I/O.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The working directory's own name is never silently adopted; the caller must ask or fall back explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the precedence, why the working directory is asked about, and the derivation for other targets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two path resolutions and one comparison, linear in path length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call decides one request once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns a string or nothing and retains nothing.
