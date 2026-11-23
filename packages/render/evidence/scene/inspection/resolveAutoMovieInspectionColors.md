# src/index.ts#resolveAutoMovieInspectionColors

## @evidence contracts/development/common.md#meaningful-documentation

States where each kind's label and colour come from, the three refusals and what each names, and the order.

## @evidence contracts/development/implementation.md#principled-implementation

A mark is identified in a reduced picture by its colour alone, so a colour may stand for one kind only, and a colour the picture already uses for something else is unavailable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass collecting each kind's entry, one applying the request's colours, then one pass checking colours against a map from colour to its first owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A clash is refused, never resolved by picking another colour, so the colour a producer documents, or the request names, is the colour drawn; a requested colour obeys the same law.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the marks plus the kinds times the request's colours, with one hashed lookup each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one picture's marks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh map and keeps nothing.
