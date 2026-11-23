# src/index.ts#writeAutoMovieModulePage

## @evidence contracts/development/common.md#meaningful-documentation

States where the page is written and why, what it holds, what the specifier is, what the configuration fields hold, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Node resolves a bare import from the importing file's folder upward, so a page written inside the production imports the production's installed packages; Vite compiles a relative import of a `.ts` file named with its extension, and the extension keeps resolution from preferring a stale `.js` beside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check, write two files, report the folder and its configuration; what the page runs is the caller's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The production's own page and configuration file are only read, never changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two small writes and three existence checks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One page per host.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned `remove` deletes the folder; the caller owns it from the return on.
