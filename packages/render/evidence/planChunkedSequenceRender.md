# src/planChunkedSequenceRender.ts#planChunkedSequenceRender

## @evidence contracts/development/implementation.md#principled-implementation

Chunks are contiguous slices of the supplied binary64 frame schedule, so the method only re-labels frames and paths and never resamples time; the concat entries are basenames with each apostrophe written as `'\''`, the quoting `av_get_token` parses, because the demuxer resolves entries against the list file's directory and ends a quoted string at an apostrophe.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The frameName, framePattern and ffmpegArgs helpers supply the same naming and encoding arguments as whole-render planning; guidePasses supplies pass normalization and naming. The production planner keeps separate partition arithmetic because its index restarts per deliverable and pass and its admission rule differs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The label pad width comes from the chunk count so labels sort in play order, the concat arguments are ffmpeg's documented lossless form, and no chunk, pass or path is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the boundary rule and why transitions survive it, that the plan holds all frames, the pass behavior for absent, empty and unknown lists, every refusal, and why production partitioning stays separate.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F frames, C chunks and P requested passes the metadata work is O(F + C * (P + 1)): each frame is sliced and re-labelled once, while each chunk builds paths and arguments and repeats bounded distinct-pass planning. Path string lengths additionally drive formatting and concat escaping.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The planner builds one chunk plan from one whole plan per call and coordinates no phases or consumers whose results it could share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller-owned plan holds F relabelled frame records plus O(C * (P + 1)) pass/chunk path records and strings, whose byte lengths depend on supplied paths. Frame spreads share original non-path fields; per-chunk slice arrays become collectable after mapping, and this planner opens no handle or task.
