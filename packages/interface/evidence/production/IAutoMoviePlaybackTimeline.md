# src/production/IAutoMoviePlaybackTimeline.ts#IAutoMoviePlaybackTimeline

## @evidence contracts/development/design.md#principled-representation `runtime` is the end of the last entry, `start + played`, which equals the sum of played spans minus the sum of transition durations that `cutSequence` reports, and the entries tile `[0, runtime)` without gaps because each start is the previous end pulled back only by an overlap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds the placements and the one derived total, so a random-access resolver, a forward cursor and the plans all read one precomputed layout instead of repeating the overlap arithmetic per instant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The timeline carries no per-consumer field; the render plan, caption plan and frame sampler read the same entries and runtime.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its precondition, the consumers and how they reuse it, the entry order, and how runtime is computed and in which unit.
