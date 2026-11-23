# src/drawing/deriveAutoMovieDrawingSchedule.ts#deriveAutoMovieDrawingSchedule

## @evidence contracts/development/implementation.md#principled-implementation

Groups occurrences by a JSON-encoded type key and orders rows by a total comparator ending in identity, so the result does not depend on declaration order; sizes come from the shared opening rule, the declared-box rule and the connector sections, and the digest is SHA-256 of `canonicalizeAutoMovieJson`, a deterministic encoding of the record's JSON payload, without a hash-injectivity guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One derivation per subject feeding one grouping and marking pass; room membership, contents, adjacency, connection and fidelity are the architecture queries rather than re-implementations, and box and size rules live in shared helpers the drawing also reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No design, kind or id shape is special-cased; membership comes from declarations, never from id prefixes, an unmeasurable occurrence is `unmeasured` rather than zero, and each subject's undelivered content is a declared gap.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the refusal, the total's meaning, grouping and row identity, order and marks, the member bound, each subject's sizing and basis, the room row's location and two boxes, the gap policy and the digest's coverage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Full environment validation precedes derivation. Opening/connector scans include profile edges, placed fill triangles or section samples; each room invokes graph/bounds queries whose repeated scans scale with spaces times design size. Every bucket and its member ids are sorted before prefix truncation, as are rows, so ordering costs O(N log N) overall in occurrences, plus encoded text and canonical key sorts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The opening subject builds one design index that shares id lookups, world matrices and part tessellations across opening rows. Room queries keep their own request-local work and connector rows need no index; no cross-call cache can conceal a mutable environment edit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The index, occurrences and grouping map are owned by the call and released on return, bounded by the design's size; only the returned schedule, owned by the caller, survives.
