# src/internal/decodeJson.ts#decodeJson

## @evidence contracts/development/implementation.md#principled-implementation

JSON.parse admits syntax before an iterative container/name scan rejects escaped-equivalent duplicates without recursion depth limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

UTF-8, syntax and duplicate-member admission form one byte ingress shared by glTF and GLB.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Last-wins duplicate keys cannot hide a competing loader interpretation, and invalid UTF-8 is not repaired.

## @evidence contracts/development/common.md#meaningful-documentation

Prose names strict decoding, escape-equivalent duplication, iterative depth behavior and diagnostic wrapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

Text length drives O(N) parsing and duplicate scan; object name sets and scope stack scale with input members and depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Syntax is parsed once and reused by the duplicate scan's valid-text premise; escaped names alone require local JSON string decoding.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Text, scope stack and key sets are temporary; only the caller-owned parsed JSON tree survives return.
