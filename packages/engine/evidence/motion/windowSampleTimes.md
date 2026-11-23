# src/motion/windowSampleTimes.ts#windowSampleTimes

## @evidence contracts/development/implementation.md#principled-implementation

Rounds interval count upward, emits start plus index divided by rate clamped to end, and removes the final duplicate caused by binary64 just-above-integer rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns shifted and zero-origin sampling clocks; motion and physics callers admit finite ordered windows and positive rates before reaching this arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The final exact-equality removal targets a zero-width duplicate, not a fuzzy coalescing of nearby legitimate samples; malformed quantities are outside the admitted-window premise and no named consumer changes the clock.

## @evidence contracts/development/common.md#meaningful-documentation

Documents finite ordered seconds, positive Hz, zero width, inclusive endpoints and owned output.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F chosen intervals, construction is O(F) time and space with one constant-time tail check; requested grid size remains caller-controlled with no arbitrary frame cap.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The interval count is computed once and shared by allocation and generation; sampleTimes delegates here, and no cross-call clock cache is maintained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the grid and all temporary allocation is invocation-local; no sampling task or external resource is retained.
