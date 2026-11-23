# src/planViewerFrameTimes.ts#planViewerFrameTimes

## @evidence contracts/development/common.md#meaningful-documentation

The comment states both request forms, the frame-grid alignment of ranges, the kept explicit seconds and the result's order and bounds; each option states its unit.

## @evidence contracts/development/implementation.md#principled-implementation

A range is enumerated in whole frame indices, from the first index at or after `from` to the last at or before `to`, so floating-point step sums never drift off the encoded grid; a `step` is converted to the nearest frame index per sample and repeats are removed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function owns request validation and enumeration; capture and naming belong to renderViewerFrames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No default range or interval is invented: a request without `at` or a complete range, or with both forms, throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Enumeration is linear in the number of planned frames, plus a sort of explicit seconds; nothing scans the whole film when a short range is requested.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call plans from its arguments alone; there is no shared work to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned array is allocated, bounded by the requested range divided by its interval.
