# src/capture/index.ts#planAutoMovieCaptureFrames

## @evidence contracts/development/common.md#meaningful-documentation

States the frame grid, how each source of instants maps onto it, the window rule and its bounds, the order of the result, and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Even samples are enumerated by index from `from` rather than by summing a step, then rounded to frame indices, so floating-point drift never moves a still off the grid; windows are counted in frames, so on a 30 fps subject they hold every frame around an instant, as `.agents/skills/visual-debugging/capture.md` asks around every contact, cut and join, instead of a fixed fraction of a second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the request, gather frame indices and explicit seconds into one map keyed by what they show, then sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing outside the subject is clamped into it: an instant outside throws, and only a window is cut at the bounds, which the result reports.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the planned samples and window frames plus one sort of the merged instants.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its request.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one map of the planned instants, bounded by the samples plus `2 × window + 1` per event and cut.
