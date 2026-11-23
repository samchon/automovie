# src/narrative/internal/metadataRewrite/validateRenderedSample.ts#validateRenderedSample

## @evidence contracts/development/implementation.md#principled-implementation

Require a bulk sample and check normalized file, positive line, nonempty fields and exact parsed candidate declaration text.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Already-built projections bind the record without rereading or reparsing Markdown.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only changed metadata files qualify; nearby authored text or unchanged declarations cannot substitute.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the audit-record requirement; consistency validation does not independently observe readability.

## @evidence contracts/development/implementation.md#efficient-algorithms

File membership scans F changed names; field checks scale with text and Map lookups reuse captured content.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing changed-file and projection populations are reused without a second filesystem scan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Diagnostics and projections remain caller-owned; the shallow returned record holds sample fields with no handles or global state.
