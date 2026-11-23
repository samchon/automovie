# src/geometry/curve/planAutoMovieContourWalks64.ts#planAutoMovieContourWalks64

## @evidence contracts/development/implementation.md#principled-implementation

A fixed slit walk retains declared point identity while later shared boundary insertions are expanded in the original oriented sheet order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation chooses slit geometry; resolution consumes the finished common boundary without mutating it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No proximity weld, source topology, normal field or emission-time seam recomputation substitutes for sheet identity.

## @evidence contracts/development/common.md#meaningful-documentation

States ordering, the preparation barrier and the distinction between slit decisions and shared refinement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each planned join uses the curve helper's O(nm) closest-segment search; resolution indexes each shared ring once and emits only the retained walk points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cached slit walks are reused during emission; each resolved boundary index is shared by all adjacent walks in this invocation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Plan and index maps belong to the returned per-generation closures and expire with their caller; there is no global cache.
