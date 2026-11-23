# src/render/compareAutoMovieRenderTarget.ts#compareAutoMovieRenderTarget

## @evidence contracts/development/implementation.md#principled-implementation

Compare sealed protocol, texture identity, renderer fields, settings and asset path/digest sets, then sort all differences by field path; freshness means no compared field changed, not that a target was remeasured.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparator owns report/current equality while summaries and consumers format or act on its explicit drift rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent texture/asset markers cannot alias an admitted SHA digest; no stale target is converted into a budget pass or repaired using an expected value.

## @evidence contracts/development/common.md#meaningful-documentation

Props distinguish borrowed report and current target, and return docs identify freshness and ordered diagnostic rows; caller-admitted sealed records are required.

## @evidence contracts/development/implementation.md#efficient-algorithms

A reported/current assets build two maps and linear comparison passes, followed by O(D log D) drift sorting; storage is O(A+D), including field strings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Asset maps serve all lookups in one comparison and each caller reuses the returned drift; no persistent cache assumes mutable sealed records remain unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only drift rows transfer to the caller; target assets remain borrowed and no asset handle, renderer or asynchronous work is retained.
