# src/delivery/planAutoMovieDeliveredCut.ts#planAutoMovieDeliveredCut

## @evidence contracts/development/implementation.md#principled-implementation

Applies `playbackCursor`'s rule, the highest entry whose `start` is at or before the instant, to the very instants `frameTimes` gave the render, so each row's `liveFrames` names the entry the drawn frame sampled. Comparing on those floating-point instants instead of rounding `start * fps` keeps a start that equals a frame's `i / fps` on that frame. The premise is the timeline's non-decreasing starts, which `cutSequence` guarantees for `sequenceTimeline`'s output; frames before the first start belong to the first entry because the cursor starts there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function owns the frame-to-entry mapping; `renderAutoMovieDrawnVideo` calls it with its schedule and the CLI only copies the rows into its report, so the rule lives in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or rounding is applied to starts, and no single-shot cut is invented; an empty timeline throws rather than returning rows that cover nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' clocks, the live-entry rule and its source, why the comparison uses the drawn instants, the copied fields and optional rate, empty ranges, the tiling and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sweep over F frames with a cursor over E entries, O(F + E) time and O(E) space; the sweep is negligible beside drawing F frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It runs once per render on that render's schedule; nothing is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or retained state beyond its returned rows.
