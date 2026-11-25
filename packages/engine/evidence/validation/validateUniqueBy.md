# src/validation/validateUniqueBy.ts#validateUniqueBy

## @evidence contracts/development/implementation.md#principled-implementation

Scan string-valued ids with a seen set, reporting later occurrences at supplied paths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Callers own identity extraction and this helper owns ordered duplicate detection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every declared id enters the seen set, empty strings included.

## @evidence contracts/development/common.md#meaningful-documentation

Rows/labels are borrowed and repeated string ids retain exact authored spelling.

## @evidence contracts/development/implementation.md#efficient-algorithms

N rows take expected O(N) set work and O(U) retained strings during the call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The local set shares first-seen lookup without cross-artifact caching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The set releases after validation; only caller-owned diagnostics remain.
