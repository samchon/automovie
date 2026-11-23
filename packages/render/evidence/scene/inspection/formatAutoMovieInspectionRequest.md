# src/scene/inspection/formatAutoMovieInspectionRequest.ts#formatAutoMovieInspectionRequest

## @evidence contracts/development/common.md#meaningful-documentation

States the order, which keys are left out, how each value form is written, the one form a cut takes and the round trip it guarantees.

## @evidence contracts/development/implementation.md#principled-implementation

The writer mirrors the parser key by key: the absent values are read from the parser itself, a value equal to one is omitted because omitting it reads back the same, and `String` of a finite number is the shortest text that reads back as that number, so the round trip is exact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list built key by key in the parser's order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No default is restated: the parser's own empty request supplies them. An axis cut is written in the general form, which reads back as the same point and normal, instead of guessing which axis form it came from.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the length of the written text, plus one parse of no keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh pairs and keeps nothing.
