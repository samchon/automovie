# src/index.ts#createAutoMovieInspectorAddressWriter

## @evidence contracts/development/common.md#meaningful-documentation

States what becomes of each text, what is kept, the empty and unchanged cases, why history gains no entry, and that nothing global is reached.

## @evidence contracts/development/implementation.md#principled-implementation `replaceState` changes the current entry's URL without navigating or adding an entry, and `location.search` is `?` plus the query, or empty, which the comparison mirrors.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closure over the two injected objects.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No `window` is read; the host's objects are the only ones written.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work plus the length of the address per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An unchanged query is not written again, which the inspector's report at mount relies on.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the two borrowed objects for as long as the listener lives; nothing else.
