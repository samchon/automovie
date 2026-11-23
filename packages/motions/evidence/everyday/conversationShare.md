# src/everyday/conversationShare.ts#conversationShare

## @evidence contracts/development/common.md#meaningful-documentation

Describes the attention interval and the film time measured.

## @evidence contracts/development/implementation.md#principled-implementation

Intersects each person request's effective range with the measurement span, using the same latest-request precedence as the gaze layer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass accumulates durations before normalization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Measures authored times directly and counts no pose-derived value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in requests with constant auxiliary space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The scalar depends on all intersected requests and the queried span.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The query retains no state.
