# src/internal/index.ts#protectedFileKind

## @evidence contracts/development/implementation.md#principled-implementation

lstat every relative component, rejecting symlinks and nondirectory ancestors before accepting a regular final file.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Physical checks supplement lexical validation so selected paths cannot bypass safety.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only ENOENT becomes missing; other filesystem errors propagate without unsafe retries.

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies missing, regular and unsafe path categories.

## @evidence contracts/development/implementation.md#efficient-algorithms

D components require up to D synchronous lstat calls plus accumulated path-construction work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both roots are checked independently because physical identities and file kinds may differ.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Synchronous stats leave no open handles; paths and stat objects remain call-local.
