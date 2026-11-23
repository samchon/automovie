# src/index.ts#legendAutoMovieInspectionMarks

## @evidence contracts/development/common.md#meaningful-documentation

States what is listed and counted, the label of a flag entry, the order and the kind that has no own entry.

## @evidence contracts/development/implementation.md#principled-implementation

The legend reports the colours drawn: a flagged mark is drawn in the flag colour, so it is counted there under its kind's name, which keeps one flag colour and still says what was flagged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass counting per kind, then one pass writing entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A count of zero gives no entry, so an absent finding never reads as a mark.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the marks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one picture's marks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh entries and keeps nothing.
