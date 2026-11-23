# src/capture/formatAutoMovieCapturePlanRequest.ts#formatAutoMovieCapturePlanRequest

## @evidence contracts/development/common.md#meaningful-documentation

States the order, which keys are left out, how each value form is written, how passes and shade share one concept, and the round trip it guarantees.

## @evidence contracts/development/implementation.md#principled-implementation

The writer mirrors the reader key by key, and the absent values are read from the reader itself rather than restated, so a value equal to one is omitted because omitting it reads back the same; `String` of a finite number is the shortest text that reads back as that number.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list built in the reader's key order, then the inspection core's own writer for its keys.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No default is restated, and a pass list is written through exactly one of `passes` and `shade`, the form the reader accepts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the length of the written text, plus one read of no keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh pairs and keeps nothing.
