# src/internal/index.ts#invalidUtf8Offset

## @evidence contracts/development/implementation.md#principled-implementation

Validate UTF-8 byte classes, rejecting truncation, overlong forms, surrogates and values above U+10ffff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One advancing index reports the first invalid sequence start without decoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ranges implement encoding constraints; invalid sequences are never replaced.

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines invalid-start offsets and -1 for valid input.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each byte is inspected a bounded number of times: O(B) time and constant auxiliary space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared range predicates are reused; every distinct buffer still requires validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The borrowed buffer is not retained; only scalar indexes are owned.
