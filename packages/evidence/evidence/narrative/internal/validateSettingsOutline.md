# src/internal/index.ts#validateSettingsOutline

## @evidence contracts/development/implementation.md#principled-implementation

The outline's structural headings are matched sequentially against numbered canon paths and each file's single H1; path-encoded anchors and exact titles enforce one ordered entry per canon file without judging semantic grouping.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The validator owns settings index topology, leaving citation cardinality to the graph and grouping quality to independent review.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty outline parts, missing/extra/reordered entries and title/anchor differences fail directly; comments and fenced examples are inert structural material for every input.

## @evidence contracts/development/common.md#meaningful-documentation

The prose states path-derived anchors, H1 label equality, actual order and boundaries between topology, graph evidence and semantic review.

## @evidence contracts/development/implementation.md#efficient-algorithms

Canon enumeration sorts entries, then the outline and each referenced file are read/parsed once; cost grows with entry sorting and total Markdown characters. Arrays retain parsed headings and paths, and the active document bytes are bounded by each read rather than an external fixed cap.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ordered canon list is reused for all outline entries, while each matched file is read once; no cross-call cache is safe because canon bytes and topology are mutable.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All strings, heading arrays and path collections are local and released on completion/failure; synchronous readFileSync calls own no retained descriptor or asynchronous task.
