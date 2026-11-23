# src/draw/selectAutoMovieDrawSubject.ts#selectAutoMovieDrawSubject

## @evidence contracts/development/common.md#meaningful-documentation

States the two ways a subject is chosen and the three refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A name is matched exactly against the module's own keys, and an absent name is accepted only where it cannot be ambiguous.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per refusal, then the choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No first subject is guessed for an absent name, and a mistyped name is refused instead of falling back.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the offered names.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure choice made once per page.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one string and keeps nothing.
