# src/sliceCaptionSidecar.ts#sliceCaptionSidecar

## @evidence contracts/development/implementation.md#principled-implementation

Spans are sorted, contiguous half-open intervals, so a binary search finds the first span ending after `frameStart`, and spans are then clipped with `max` and `min` until one starts at or after the clamped end; clipping cannot empty a visited span because each one overlaps the window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The slicer reads only the sidecar, not the chunk plan, so a host can pair any chunk window with its caption track; the clamp is a named helper because the coverage refusal and the clamp are separate rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A window beyond coverage throws instead of returning an empty or negative-length slice, and no window or sidecar is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the clipping and re-basing, the clamp for the last chunk, each refusal, and the frame-count mismatch a coverage refusal signals.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S spans and K spans overlapping one window, bisection plus clipping costs O(log(S+1) + K). For C contiguous chunk windows that partition the coverage, each internal boundary adds at most one repeated span visit, so total work is O(C log(S+1) + S); a single long span can still appear in all C outputs, and no span or chunk count cap is imposed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call slices one window; chunk windows are disjoint, so there is no equivalent result to reuse between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function retains nothing; the returned sidecar, owned by the caller, holds exactly the K overlapping spans as new objects and never aliases the input's spans.
