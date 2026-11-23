# src/production/IAutoMovieSummarizeCompiledSlotChunks.ts#IAutoMovieSummarizeCompiledSlotChunks.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents zero-based contiguous addresses, world-metre point semantics, hero inclusion, output ownership, empty behavior and callback failure.

## @evidence contracts/development/design.md#principled-representation

Ordered chunk records describe disjoint half-open slot intervals and summaries over their actual points; index is a chunk ordinal, not a member ID or spatial key.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Formation and instance materializers consume both chunk and global summaries from the same traversal, avoiding a second placement pass.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Chunk centroid is a running mean of members rather than a box centre, and whole centroid is folded from every point rather than an unweighted mean of chunks.
