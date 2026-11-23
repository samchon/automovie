# src/internal/decodeGlb.ts#decodeGlb

## @evidence contracts/development/implementation.md#principled-implementation

Magic, version, exact length, four-byte chunk alignment and JSON-first ordering establish the container; BIN remains a read-only input view.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Container framing belongs here while strict JSON and duplicate-member checks belong to the shared JSON decoder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unexpected or repeated trailing chunks and invalid extents throw rather than truncating or guessing a payload.

## @evidence contracts/development/common.md#meaningful-documentation

Comments give version/alignment rules, optional BIN aliasing and suffix-provided VRM container identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Header/chunk scanning is O(chunk count); JSON decoding is O(JSON bytes), and BIN bytes are not copied.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same decoded JSON owner serves both GLB and plain glTF; one BIN view is reused by downstream payload readers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The parsed result borrows BIN bytes only during synchronous inspection; JSON objects and view references are call-local.
