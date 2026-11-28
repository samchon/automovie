# src/capture/AutoMovieRenderCapturePlanKeys.ts#AutoMovieRenderCapturePlanKeys

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shared request grammar and the order its formatter emits keys.

## @evidence contracts/development/implementation.md#principled-implementation

The key list adds cue and entry at the capture boundary, so all hosts share the same name admission and preserve the single canonical formatting order.

## @evidence contracts/development/implementation.md#efficient-algorithms

The parser creates one reusable lookup over static keys. Individual host requests walk only their supplied keys.
