# src/internal/index.ts#originalOffset

## @evidence contracts/development/implementation.md#principled-implementation

Locate the protected span containing an offset and add its displacement; projected EOF maps to source EOF.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Existing span mappings reconnect projection diagnostics to original bytes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unmatched spans fall back to source EOF rather than invented interior coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states source-offset mapping; coordinates are byte offsets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear find examines up to S segments with constant auxiliary space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The projection's existing segments are reused without source reparsing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The projection is borrowed; no reference persists after return.
