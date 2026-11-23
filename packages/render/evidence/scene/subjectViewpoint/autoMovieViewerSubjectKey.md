# src/index.ts#autoMovieViewerSubjectKey

## @evidence contracts/development/implementation.md#principled-implementation

Preserves authored category/id text and appends the optional revision using the parser's first-colon/last-at grammar; reserved delimiter restrictions are a caller premise, not enforced here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One textual inspection identity is separate from scene resolution and capture metadata.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Encoding does not validate category membership, escape delimiter ambiguity or establish that the named source exists.

## @evidence contracts/development/common.md#meaningful-documentation

States exact syntax and the nonempty/delimiter premises needed for parser round-trip.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies O(id+revision) text into one key, with no scene traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated inputs produce equal text without caching; text equality alone cannot certify current source or revision content.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned string is caller owned and retains no scene, renderer or identity registry.
