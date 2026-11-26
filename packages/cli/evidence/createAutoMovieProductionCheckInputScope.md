# src/createAutoMovieProductionCheckInputScope.ts#createAutoMovieProductionCheckInputScope

## @evidence contracts/development/common.md#meaningful-documentation

Defines the production and checkout boundaries and documents resolution of explicitly named inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Canonical directory and file paths establish physical containment. Native relative paths distinguish another drive, ancestors and equal paths, and Git identifies the worktree owning a nested production.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scope owns input admission and the canonical directories that the evaluator needs for legacy captures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both the declared path and the dereferenced file must be within the admitted boundary. Absolute paths and unverified parent escapes fail before hashing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolution touches one named path at a time. Git discovery is lazy and reads the worktree address without enumerating its files.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One evaluation reuses its canonical production and discovered checkout directories. Each input is resolved when the evaluator reads it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scope retains only the two root resolutions for its evaluation. Git discovery is a short-lived command and input resolution opens no streaming resource.
